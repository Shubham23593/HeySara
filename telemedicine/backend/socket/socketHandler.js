import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Queue from '../models/Queue.js';
import queueService from '../services/queueOptimization.service.js';

const socketHandler = (io) => {
  queueService.setIO(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Room join events
    socket.on('joinDoctorRoom', ({ doctorId }) => {
      socket.join(`doctor-${doctorId}`);
      console.log(`Doctor ${doctorId} joined room doctor-${doctorId}`);
    });

    socket.on('joinPatientRoom', ({ patientId }) => {
      socket.join(`patient-${patientId}`);
      console.log(`Patient ${patientId} joined room patient-${patientId}`);
    });

    socket.on('joinAdminRoom', () => {
      socket.join('admin');
      console.log(`Admin joined admin room`);
    });

    // Doctor toggles status
    socket.on('doctorStatusChanged', async ({ doctorId, status }) => {
      try {
        const doctor = await Doctor.findByIdAndUpdate(
          doctorId,
          { status },
          { new: true }
        );
        if (!doctor) return;

        io.to('admin').emit('doctorStatusChanged', {
          doctorId,
          status,
          doctorName: doctor.name,
          timestamp: new Date(),
        });

        // If doctor goes INACTIVE, reassign their waiting patients
        if (status === 'INACTIVE') {
          const waitingPatients = await Patient.find({
            assignedDoctor: doctorId,
            status: 'waiting',
          });

          for (const patient of waitingPatients) {
            const newDoctor = await queueService.findBestDoctor(patient.doctorSpecialization);
            if (newDoctor && newDoctor._id.toString() !== doctorId) {
              await Queue.findOneAndUpdate(
                { doctor: doctorId },
                { $pull: { patients: patient._id }, updatedAt: new Date() }
              );
              doctor.queueLength = Math.max(0, doctor.queueLength - 1);
              await doctor.save();

              patient.status = 'reassigned';
              await patient.save();
              await queueService.assignPatientToDoctor(patient, newDoctor);
              patient.status = 'waiting';
              await patient.save();

              io.to(`patient-${patient._id}`).emit('patientReassigned', {
                patientId: patient._id,
                newDoctorId: newDoctor._id,
                newDoctorName: newDoctor.name,
                message: `Your doctor is now unavailable. Reassigned to Dr. ${newDoctor.name}`,
                timestamp: new Date(),
              });

              await queueService.broadcastQueueUpdate(newDoctor._id);
            }
          }
          await queueService.broadcastQueueUpdate(doctorId);
        }
      } catch (err) {
        console.error('doctorStatusChanged error:', err.message);
      }
    });

    // Doctor starts consultation
    socket.on('consultationStarted', async ({ doctorId, patientId, consultationId }) => {
      io.to(`patient-${patientId}`).emit('consultationStarted', {
        doctorId,
        patientId,
        consultationId,
        message: 'Your consultation has started',
        timestamp: new Date(),
      });
      io.to('admin').emit('consultationStarted', { doctorId, patientId, consultationId, timestamp: new Date() });
    });

    // Doctor ends consultation
    socket.on('consultationEnded', async ({ doctorId, patientId, consultationId, actualDuration }) => {
      io.to(`patient-${patientId}`).emit('consultationEnded', {
        doctorId,
        patientId,
        consultationId,
        message: 'Your consultation has ended',
        timestamp: new Date(),
      });
      io.to('admin').emit('consultationEnded', { doctorId, patientId, consultationId, actualDuration, timestamp: new Date() });

      // Cascade effect: if actualDuration > predictedDuration, recalculate
      try {
        const patient = await Patient.findById(patientId);
        if (patient && actualDuration > patient.predictedDuration) {
          console.log('Cascade effect triggered: recalculating queues');
          await queueService.recalculateAllQueues();
        }
      } catch (err) {
        console.error('consultationEnded cascade error:', err.message);
      }
    });

    // New patient joined queue
    socket.on('newPatientJoined', ({ doctorId, patient }) => {
      io.to(`doctor-${doctorId}`).emit('newPatientJoined', {
        patient,
        message: `New patient ${patient.name} has joined your queue`,
        timestamp: new Date(),
      });
      io.to('admin').emit('newPatientJoined', { doctorId, patient, timestamp: new Date() });
    });

    // Patient reassigned
    socket.on('patientReassigned', ({ patientId, oldDoctorId, newDoctorId }) => {
      io.to(`patient-${patientId}`).emit('patientReassigned', {
        patientId,
        oldDoctorId,
        newDoctorId,
        timestamp: new Date(),
      });
    });

    // Critical surge alert
    socket.on('criticalAlert', ({ specialization, count }) => {
      io.to('admin').emit('criticalAlert', {
        type: 'CRITICAL_SURGE',
        specialization,
        count,
        timestamp: new Date(),
      });
    });

    // Patient urgent request
    socket.on('urgentRequest', async ({ patientId, message }) => {
      try {
        const patient = await Patient.findById(patientId).populate('assignedDoctor');
        if (!patient) return;

        const doctorId = patient.assignedDoctor?._id;
        if (doctorId) {
          io.to(`doctor-${doctorId}`).emit('urgentRequest', {
            patientId,
            patientName: patient.name,
            message: message || 'Patient has flagged an urgent situation',
            timestamp: new Date(),
          });
        }

        io.to('admin').emit('urgentRequest', {
          patientId,
          patientName: patient.name,
          doctorId,
          message,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('urgentRequest error:', err.message);
      }
    });

    // General notification relay
    socket.on('notification', ({ targetRoom, payload }) => {
      if (targetRoom) {
        io.to(targetRoom).emit('notification', { ...payload, timestamp: new Date() });
      }
    });

    // Real-time chat during consultation
    socket.on('chatMessage', async ({ consultationId, sender, text, roomId }) => {
      const message = { sender, text, timestamp: new Date() };
      // Broadcast to consultation room
      io.to(roomId || consultationId).emit('chatMessage', { consultationId, ...message });
    });

    socket.on('joinConsultationRoom', ({ consultationId }) => {
      socket.join(consultationId);
    });

    // WebRTC signaling
    socket.on('videoSignal', ({ to, signal, type }) => {
      io.to(to).emit('videoSignal', { from: socket.id, signal, type });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default socketHandler;
