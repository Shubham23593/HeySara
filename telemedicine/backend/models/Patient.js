import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  visitType: { type: String, enum: ['Checkup', 'Follow-up'], default: 'Checkup' },
  symptoms: { type: String, default: '' },
  previousVisits: { type: Number, default: 0 },
  emergencyLevel: { type: Number, min: 1, max: 5, default: 1 },
  doctorSpecialization: { type: String, default: 'General Physician' },
  isCriticalOperationToday: { type: Boolean, default: false },
  predictedDuration: { type: Number, default: 15 },
  actualDuration: { type: Number, default: null },
  status: {
    type: String,
    enum: ['waiting', 'in-consultation', 'completed', 'reassigned'],
    default: 'waiting',
  },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  priorityScore: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  consultationStartedAt: { type: Date, default: null },
  consultationEndedAt: { type: Date, default: null },
  role: { type: String, default: 'patient' },
});

PatientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

PatientSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('Patient', PatientSchema);
