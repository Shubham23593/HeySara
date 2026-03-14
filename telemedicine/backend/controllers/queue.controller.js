import Queue from '../models/Queue.js';
import Patient from '../models/Patient.js';
import queueService from '../services/queueOptimization.service.js';

export const getLiveQueue = async (req, res, next) => {
  try {
    const queues = await Queue.find()
      .populate('doctor', 'name specialization status')
      .populate({
        path: 'patients',
        match: { status: { $in: ['waiting', 'in-consultation'] } },
      });

    const bySpecialization = {};
    for (const queue of queues) {
      if (!queue.doctor) continue;
      const spec = queue.doctor.specialization;
      if (!bySpecialization[spec]) {
        bySpecialization[spec] = {
          specialization: spec,
          doctors: [],
        };
      }
      bySpecialization[spec].doctors.push({
        doctorId: queue.doctor._id,
        doctorName: queue.doctor.name,
        status: queue.doctor.status,
        patients: queueService.sortQueueByPriority(queue.patients),
        waitingCount: queue.patients.filter((p) => p.status === 'waiting').length,
        inConsultationCount: queue.patients.filter((p) => p.status === 'in-consultation').length,
      });
    }

    return res.json({ success: true, data: Object.values(bySpecialization) });
  } catch (err) {
    next(err);
  }
};

export const recalculateQueues = async (req, res, next) => {
  try {
    await queueService.recalculateAllQueues();
    return res.json({ success: true, message: 'All queues recalculated and broadcast' });
  } catch (err) {
    next(err);
  }
};
