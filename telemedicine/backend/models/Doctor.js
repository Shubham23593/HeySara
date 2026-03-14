import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SPECIALIZATIONS = [
  'Cardiologist',
  'Neurologist',
  'Orthopedic',
  'Dermatologist',
  'General Physician',
  'Pulmonologist',
  'Gastroenterologist',
  'Psychiatrist',
];

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  specialization: { type: String, required: true, enum: SPECIALIZATIONS },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'INACTIVE' },
  currentQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  queueLength: { type: Number, default: 0 },
  role: { type: String, default: 'doctor' },
  createdAt: { type: Date, default: Date.now },
});

DoctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

DoctorSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export const DOCTOR_SPECIALIZATIONS = SPECIALIZATIONS;
export default mongoose.model('Doctor', DoctorSchema);
