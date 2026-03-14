import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ConsultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  mode: { type: String, enum: ['chat', 'video'], default: 'chat' },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  predictedDuration: { type: Number, default: 15 },
  actualDuration: { type: Number, default: null },
  chatMessages: [ChatMessageSchema],
});

export default mongoose.model('Consultation', ConsultationSchema);
