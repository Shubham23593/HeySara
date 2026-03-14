import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import Consultation from '../models/Consultation.js';
import queueService from '../services/queueOptimization.service.js';

export const getDoctorQueue = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const queue = await Queue.findOne({ doctor: doctorId }).populate({
      path: 'patients',
      match: { status: { $in: ['waiting', 'in-consultation'] } },
    });

    if (!queue) return res.json({ success: true, data: { patients: [], total: 0 } });

    const sorted = queueService.sortQueueByPriority(queue.patients);
    return res.json({ success: true, data: { patients: sorted, total: sorted.length } });
  } catch (err) {
    next(err);
  }
};

export const toggleStatus = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE' });
    }

    const doctor = await Doctor.findByIdAndUpdate(doctorId, { status }, { new: true }).select('-password');
    return res.json({ success: true, data: { status: doctor.status, doctorId: doctor._id } });
  } catch (err) {
    next(err);
  }
};

export const startSession = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const { patientId } = req.params;
    const { mode = 'chat' } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (patient.assignedDoctor?.toString() !== doctorId.toString()) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you' });
    }

    patient.status = 'in-consultation';
    patient.consultationStartedAt = new Date();
    await patient.save();

    const consultation = await Consultation.create({
      patient: patientId,
      doctor: doctorId,
      mode,
      status: 'active',
      startTime: new Date(),
      predictedDuration: patient.predictedDuration,
    });

    await queueService.broadcastQueueUpdate(doctorId);

    return res.json({
      success: true,
      message: 'Consultation started',
      data: { consultationId: consultation._id, patientId, mode },
    });
  } catch (err) {
    next(err);
  }
};

export const endSession = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const endTime = new Date();
    const startTime = patient.consultationStartedAt || new Date();
    const actualDuration = Math.round((endTime - startTime) / 60000);

    patient.status = 'completed';
    patient.consultationEndedAt = endTime;
    patient.actualDuration = actualDuration;
    await patient.save();

    const consultation = await Consultation.findOneAndUpdate(
      { patient: patientId, doctor: doctorId, status: 'active' },
      { status: 'ended', endTime, actualDuration },
      { new: true }
    );

    // Remove from doctor's queue
    await Queue.findOneAndUpdate(
      { doctor: doctorId },
      { $pull: { patients: patient._id }, updatedAt: new Date() }
    );

    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      doctor.currentQueue = doctor.currentQueue.filter(
        (id) => id.toString() !== patientId.toString()
      );
      doctor.queueLength = doctor.currentQueue.length;
      await doctor.save();
    }

    // Cascade effect: if overran, recalculate
    if (actualDuration > patient.predictedDuration) {
      await queueService.recalculateAllQueues();
    } else {
      await queueService.broadcastQueueUpdate(doctorId);
    }

    return res.json({
      success: true,
      message: 'Consultation ended',
      data: { consultationId: consultation?._id, actualDuration },
    });
  } catch (err) {
    next(err);
  }
};

export const acceptUrgent = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Move urgent patient to top by boosting priority
    patient.priorityScore = patient.priorityScore + 1000;
    await patient.save();

    await queueService.broadcastQueueUpdate(doctorId);

    return res.json({
      success: true,
      message: 'Urgent request accepted, patient moved to top of queue',
      data: { patientId, priorityScore: patient.priorityScore },
    });
  } catch (err) {
    next(err);
  }
};
