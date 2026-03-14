import mongoose from 'mongoose';

const QueueSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Queue', QueueSchema);
