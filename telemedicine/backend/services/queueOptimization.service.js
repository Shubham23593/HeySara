import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';

const CRITICAL_SURGE_THRESHOLD = 4;
const INACTION_TIMEOUT_MINUTES = 3;
const INACTION_TIMEOUT_MS = INACTION_TIMEOUT_MINUTES * 60 * 1000;
const STARVATION_INTERVAL_MINUTES = 5;
const STARVATION_INTERVAL_MS = STARVATION_INTERVAL_MINUTES * 60 * 1000;

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

// Priority Score = (emergencyLevel^2 * 10) + (waitingTimeMinutes * 1) + (previousVisits * 2)
const calculatePriorityScore = (patient) => {
  const waitingMs = Date.now() - new Date(patient.joinedAt).getTime();
  const waitingMinutes = waitingMs / 60000;
  return (
    Math.pow(patient.emergencyLevel, 2) * 10 +
    waitingMinutes * 1 +
    patient.previousVisits * 2
  );
};

const sortQueueByPriority = (patients) => {
  return [...patients].sort((a, b) => b.priorityScore - a.priorityScore);
};

// Find best doctor: matching specialization, ACTIVE, lowest queue
const findBestDoctor = async (specialization) => {
  const doctors = await Doctor.find({ specialization, status: 'ACTIVE' }).sort({
    queueLength: 1,
  });

  if (doctors.length > 0) return doctors[0];

  // Fallback to General Physician
  const gpDoctors = await Doctor.find({
    specialization: 'General Physician',
    status: 'ACTIVE',
  }).sort({ queueLength: 1 });

  return gpDoctors.length > 0 ? gpDoctors[0] : null;
};

const assignPatientToDoctor = async (patient, doctor) => {
  patient.assignedDoctor = doctor._id;
  patient.priorityScore = calculatePriorityScore(patient);
  await patient.save();

  let queue = await Queue.findOne({ doctor: doctor._id });
  if (!queue) {
    queue = new Queue({ doctor: doctor._id, patients: [] });
  }

  if (!queue.patients.includes(patient._id)) {
    queue.patients.push(patient._id);
  }
  queue.updatedAt = new Date();
  await queue.save();

  doctor.currentQueue = queue.patients;
  doctor.queueLength = queue.patients.length;
  await doctor.save();

  return queue;
};

const checkCriticalSurge = async (specialization) => {
  const criticalCount = await Patient.countDocuments({
    doctorSpecialization: specialization,
    emergencyLevel: 5,
    status: 'waiting',
  });

  if (criticalCount >= CRITICAL_SURGE_THRESHOLD) {
    if (ioInstance) {
      ioInstance.to('admin').emit('criticalAlert', {
        type: 'CRITICAL_SURGE',
        specialization,
        count: criticalCount,
        message: `Critical surge detected: ${criticalCount} critical patients for ${specialization}`,
        timestamp: new Date(),
      });
    }
    return true;
  }
  return false;
};

// Load balancing: overflow critical patients to other doctors of same spec or GP
const handleCriticalOverflow = async (specialization) => {
  const isSurge = await checkCriticalSurge(specialization);
  if (!isSurge) return;

  const criticalPatients = await Patient.find({
    doctorSpecialization: specialization,
    emergencyLevel: 5,
    status: 'waiting',
  }).sort({ joinedAt: 1 });

  // Get all active doctors for this spec sorted by queue
  const specDoctors = await Doctor.find({ specialization, status: 'ACTIVE' }).sort({
    queueLength: 1,
  });
  const gpDoctors = await Doctor.find({
    specialization: 'General Physician',
    status: 'ACTIVE',
  }).sort({ queueLength: 1 });

  const availableDoctors = [...specDoctors, ...gpDoctors];
  if (availableDoctors.length === 0) return;

  for (let i = 0; i < criticalPatients.length; i++) {
    const doctor = availableDoctors[i % availableDoctors.length];
    await assignPatientToDoctor(criticalPatients[i], doctor);
    await broadcastQueueUpdate(doctor._id);
  }
};

const broadcastQueueUpdate = async (doctorId) => {
  if (!ioInstance) return;
  try {
    const queue = await Queue.findOne({ doctor: doctorId }).populate('patients').populate('doctor');
    if (!queue) return;

    const sortedPatients = sortQueueByPriority(queue.patients);
    ioInstance.to(`doctor-${doctorId}`).emit('queueUpdated', {
      doctorId,
      patients: sortedPatients,
      timestamp: new Date(),
    });
    ioInstance.to('admin').emit('queueUpdated', {
      doctorId,
      patients: sortedPatients,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastQueueUpdate error:', err.message);
  }
};

// Starvation prevention: every 5 min, increment priority score for all waiting patients
const runStarvationPrevention = async () => {
  try {
    const waitingPatients = await Patient.find({ status: 'waiting' });
    for (const patient of waitingPatients) {
      patient.priorityScore = calculatePriorityScore(patient);
      patient.priorityScore += 1;
      await patient.save();
    }

    const affectedDoctorIds = [
      ...new Set(waitingPatients.map((p) => p.assignedDoctor?.toString()).filter(Boolean)),
    ];
    for (const doctorId of affectedDoctorIds) {
      await broadcastQueueUpdate(doctorId);
    }

    if (waitingPatients.length > 0) {
      console.log(`Starvation prevention: updated ${waitingPatients.length} patients`);
    }
  } catch (err) {
    console.error('Starvation prevention error:', err.message);
  }
};

// Doctor inaction detection: if doctor hasn't started session within 3 min of assignment
const runInactionCheck = async () => {
  try {
    const threshold = new Date(Date.now() - INACTION_TIMEOUT_MS);
    const inactionPatients = await Patient.find({
      status: 'waiting',
      assignedDoctor: { $ne: null },
      joinedAt: { $lte: threshold },
    }).populate('assignedDoctor');

    for (const patient of inactionPatients) {
      const doctor = patient.assignedDoctor;
      if (!doctor) continue;

      console.warn(
        `Inaction detected: Doctor ${doctor.name} has not started session for patient ${patient.name}`
      );

      if (ioInstance) {
        ioInstance.to(`doctor-${doctor._id}`).emit('notification', {
          type: 'INACTION_WARNING',
          message: `Please start consultation with patient ${patient.name}`,
          patientId: patient._id,
          timestamp: new Date(),
        });

        ioInstance.to('admin').emit('notification', {
          type: 'DOCTOR_INACTION',
          doctorId: doctor._id,
          doctorName: doctor.name,
          patientId: patient._id,
          patientName: patient.name,
          message: `Doctor ${doctor.name} has not started session for ${patient.name} within 3 minutes`,
          timestamp: new Date(),
        });
      }

      // Auto-reassign to another available doctor
      const newDoctor = await Doctor.findOne({
        specialization: doctor.specialization,
        status: 'ACTIVE',
        _id: { $ne: doctor._id },
      }).sort({ queueLength: 1 });

      const reassignTo = newDoctor || (await findBestDoctor(patient.doctorSpecialization));

      if (reassignTo) {
        // Remove from old doctor's queue
        await Queue.findOneAndUpdate(
          { doctor: doctor._id },
          { $pull: { patients: patient._id }, updatedAt: new Date() }
        );
        const freshDoctor = await Doctor.findById(doctor._id);
        if (freshDoctor) {
          freshDoctor.currentQueue = freshDoctor.currentQueue.filter(
            (id) => id.toString() !== patient._id.toString()
          );
          freshDoctor.queueLength = Math.max(0, freshDoctor.queueLength - 1);
          await freshDoctor.save();
        }

        patient.status = 'reassigned';
        await patient.save();

        await assignPatientToDoctor(patient, reassignTo);
        patient.status = 'waiting';
        await patient.save();

        if (ioInstance) {
          ioInstance.to(`patient-${patient._id}`).emit('patientReassigned', {
            patientId: patient._id,
            newDoctorId: reassignTo._id,
            newDoctorName: reassignTo.name,
            message: `You have been reassigned to Dr. ${reassignTo.name}`,
            timestamp: new Date(),
          });
        }

        await broadcastQueueUpdate(doctor._id);
        await broadcastQueueUpdate(reassignTo._id);
      }
    }
  } catch (err) {
    console.error('Inaction check error:', err.message);
  }
};

// Recalculate and re-sort all queues (called on cascade effect)
const recalculateAllQueues = async () => {
  try {
    const queues = await Queue.find().populate('patients');
    for (const queue of queues) {
      for (const patient of queue.patients) {
        if (patient.status === 'waiting') {
          patient.priorityScore = calculatePriorityScore(patient);
          await patient.save();
        }
      }
      queue.updatedAt = new Date();
      await queue.save();
      await broadcastQueueUpdate(queue.doctor.toString());
    }
  } catch (err) {
    console.error('recalculateAllQueues error:', err.message);
  }
};

export default {
  setIO,
  calculatePriorityScore,
  sortQueueByPriority,
  findBestDoctor,
  assignPatientToDoctor,
  checkCriticalSurge,
  handleCriticalOverflow,
  broadcastQueueUpdate,
  runStarvationPrevention,
  runInactionCheck,
  recalculateAllQueues,
};
