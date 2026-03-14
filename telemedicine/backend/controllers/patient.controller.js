import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import aiTriage from '../services/aiTriage.service.js';
import mlPrediction from '../services/mlPrediction.service.js';
import queueService from '../services/queueOptimization.service.js';

export const joinQueue = async (req, res, next) => {
  try {
    const { name, age, gender, email, password, visitType, symptoms, previousVisits } = req.body;

    // Upsert patient (support both registered + walk-in via form)
    let patient = await Patient.findOne({ email });
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    if (!patient) {
      patient = new Patient({ name, age, gender, email, password: password || randomPassword, visitType, symptoms, previousVisits: previousVisits || 0 });
    } else {
      patient.symptoms = symptoms;
      patient.visitType = visitType;
      patient.previousVisits = previousVisits || patient.previousVisits;
      patient.status = 'waiting';
      patient.joinedAt = new Date();
    }

    // AI Triage
    const triage = await aiTriage.triagePatient({ symptoms, age, gender, visitType });
    patient.emergencyLevel = triage.emergencyLevel;
    patient.doctorSpecialization = triage.doctorSpecialization;
    patient.isCriticalOperationToday = triage.isCriticalOperationToday;

    // ML Prediction
    const predictedDuration = await mlPrediction.predictDuration({
      age,
      emergencyLevel: triage.emergencyLevel,
      previousVisits: patient.previousVisits,
      visitType,
    });
    patient.predictedDuration = predictedDuration;
    patient.status = 'waiting';
    patient.joinedAt = new Date();
    patient.priorityScore = queueService.calculatePriorityScore(patient);
    await patient.save();

    // Assign to best doctor
    const doctor = await queueService.findBestDoctor(triage.doctorSpecialization);
    if (!doctor) {
      return res.status(503).json({ success: false, message: 'No active doctors available. Please try again later.' });
    }

    await queueService.assignPatientToDoctor(patient, doctor);
    await queueService.handleCriticalOverflow(triage.doctorSpecialization);
    await queueService.broadcastQueueUpdate(doctor._id);

    return res.status(201).json({
      success: true,
      message: 'Joined queue successfully',
      data: {
        patientId: patient._id,
        name: patient.name,
        emergencyLevel: patient.emergencyLevel,
        doctorSpecialization: patient.doctorSpecialization,
        isCriticalOperationToday: patient.isCriticalOperationToday,
        predictedDuration: patient.predictedDuration,
        priorityScore: patient.priorityScore,
        assignedDoctor: {
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
        },
        status: patient.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientStatus = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId).populate('assignedDoctor', 'name specialization status');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Calculate queue position
    let queuePosition = null;
    let totalInQueue = null;
    let estimatedWaitMinutes = null;
    if (patient.assignedDoctor && patient.status === 'waiting') {
      const queue = await Queue.findOne({ doctor: patient.assignedDoctor._id }).populate('patients');
      if (queue) {
        const sorted = queueService.sortQueueByPriority(
          queue.patients.filter((p) => p.status === 'waiting')
        );
        const idx = sorted.findIndex((p) => p._id.toString() === patientId);
        queuePosition = idx >= 0 ? idx + 1 : null;
        totalInQueue = sorted.length;
        estimatedWaitMinutes = 0;
        for (let i = 0; i < idx; i++) {
          estimatedWaitMinutes += sorted[i].predictedDuration || 15;
        }
      }
    }

    return res.json({
      success: true,
      data: {
        patientId: patient._id,
        name: patient.name,
        status: patient.status,
        emergencyLevel: patient.emergencyLevel,
        priorityScore: patient.priorityScore,
        predictedDuration: patient.predictedDuration,
        doctorSpecialization: patient.doctorSpecialization,
        assignedDoctor: patient.assignedDoctor,
        queuePosition,
        totalInQueue,
        estimatedWaitMinutes,
        joinedAt: patient.joinedAt,
        consultationStartedAt: patient.consultationStartedAt,
        consultationEndedAt: patient.consultationEndedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const urgentRequest = async (req, res, next) => {
  try {
    const { patientId, message } = req.body;
    const patient = await Patient.findById(patientId).populate('assignedDoctor');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Bump emergency level capped at 5
    patient.emergencyLevel = Math.min(5, patient.emergencyLevel + 1);
    patient.priorityScore = queueService.calculatePriorityScore(patient);
    await patient.save();

    if (patient.assignedDoctor) {
      await queueService.broadcastQueueUpdate(patient.assignedDoctor._id);
    }

    return res.json({
      success: true,
      message: 'Urgent request submitted',
      data: { emergencyLevel: patient.emergencyLevel, priorityScore: patient.priorityScore },
    });
  } catch (err) {
    next(err);
  }
};

export const getQueuePosition = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    if (!patient.assignedDoctor || patient.status !== 'waiting') {
      return res.json({ success: true, data: { queuePosition: null, status: patient.status } });
    }

    const queue = await Queue.findOne({ doctor: patient.assignedDoctor }).populate({
      path: 'patients',
      match: { status: 'waiting' },
    });

    if (!queue) return res.json({ success: true, data: { queuePosition: null } });

    const sorted = queueService.sortQueueByPriority(queue.patients);
    const idx = sorted.findIndex((p) => p._id.toString() === patientId);

    // Estimate wait time: sum of predictedDuration of patients ahead
    let estimatedWaitMinutes = 0;
    for (let i = 0; i < idx; i++) {
      estimatedWaitMinutes += sorted[i].predictedDuration || 15;
    }

    return res.json({
      success: true,
      data: {
        queuePosition: idx >= 0 ? idx + 1 : null,
        totalInQueue: sorted.length,
        estimatedWaitMinutes,
      },
    });
  } catch (err) {
    next(err);
  }
};
