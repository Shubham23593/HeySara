import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import Consultation from '../models/Consultation.js';
import queueService from '../services/queueOptimization.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      waitingPatients,
      inConsultation,
      completedToday,
      criticalPatients,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: 'ACTIVE' }),
      Patient.countDocuments(),
      Patient.countDocuments({ status: 'waiting' }),
      Patient.countDocuments({ status: 'in-consultation' }),
      Patient.countDocuments({
        status: 'completed',
        consultationEndedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Patient.countDocuments({ emergencyLevel: 5, status: 'waiting' }),
    ]);

    const avgWaitResult = await Patient.aggregate([
      { $match: { status: 'completed', consultationStartedAt: { $ne: null }, joinedAt: { $ne: null } } },
      {
        $project: {
          waitMinutes: {
            $divide: [{ $subtract: ['$consultationStartedAt', '$joinedAt'] }, 60000],
          },
        },
      },
      { $group: { _id: null, avgWait: { $avg: '$waitMinutes' } } },
    ]);

    const avgWaitMinutes = avgWaitResult[0]?.avgWait
      ? Math.round(avgWaitResult[0].avgWait * 10) / 10
      : null;

    return res.json({
      success: true,
      data: {
        totalDoctors,
        activeDoctors,
        totalPatients,
        waitingPatients,
        inConsultation,
        completedToday,
        criticalPatients,
        avgWaitMinutes,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().select('-password').lean();
    return res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

export const getAllQueues = async (req, res, next) => {
  try {
    const queues = await Queue.find()
      .populate('doctor', 'name specialization status')
      .populate({
        path: 'patients',
        match: { status: { $in: ['waiting', 'in-consultation'] } },
      });

    const formatted = queues.map((q) => ({
      doctorId: q.doctor?._id,
      doctorName: q.doctor?.name,
      specialization: q.doctor?.specialization,
      doctorStatus: q.doctor?.status,
      patients: queueService.sortQueueByPriority(q.patients),
      totalWaiting: q.patients.filter((p) => p.status === 'waiting').length,
      updatedAt: q.updatedAt,
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    // Average wait time by specialization
    const waitBySpec = await Patient.aggregate([
      {
        $match: {
          status: 'completed',
          consultationStartedAt: { $ne: null },
          joinedAt: { $ne: null },
        },
      },
      {
        $project: {
          doctorSpecialization: 1,
          waitMinutes: {
            $divide: [{ $subtract: ['$consultationStartedAt', '$joinedAt'] }, 60000],
          },
          actualDuration: 1,
          predictedDuration: 1,
        },
      },
      {
        $group: {
          _id: '$doctorSpecialization',
          avgWaitMinutes: { $avg: '$waitMinutes' },
          avgActualDuration: { $avg: '$actualDuration' },
          avgPredictedDuration: { $avg: '$predictedDuration' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgWaitMinutes: -1 } },
    ]);

    // Throughput: patients completed per hour today
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const completedToday = await Patient.countDocuments({
      status: 'completed',
      consultationEndedAt: { $gte: todayStart },
    });
    const hoursElapsed = Math.max(1, (Date.now() - todayStart) / 3600000);
    const throughputPerHour = Math.round((completedToday / hoursElapsed) * 10) / 10;

    // FIFO vs Optimized comparison (simulated)
    // FIFO: average wait = simple mean of actual wait times
    // Optimized: critical patients get faster service
    const fifoSimulation = await Patient.aggregate([
      { $match: { status: 'completed', consultationStartedAt: { $ne: null } } },
      {
        $project: {
          waitMinutes: {
            $divide: [{ $subtract: ['$consultationStartedAt', '$joinedAt'] }, 60000],
          },
          emergencyLevel: 1,
        },
      },
      {
        $group: {
          _id: null,
          fifoAvgWait: { $avg: '$waitMinutes' },
          criticalAvgWait: {
            $avg: {
              $cond: [{ $eq: ['$emergencyLevel', 5] }, '$waitMinutes', null],
            },
          },
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        waitBySpecialization: waitBySpec,
        throughputPerHour,
        completedToday,
        fifoVsOptimized: fifoSimulation[0] || { fifoAvgWait: null, criticalAvgWait: null },
      },
    });
  } catch (err) {
    next(err);
  }
};
