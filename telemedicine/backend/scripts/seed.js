import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Doctor from '../models/Doctor.js';

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

const SEED_DOCTORS = SPECIALIZATIONS.map((spec, i) => ({
  name: `Dr. ${spec.split(' ')[0]}`,
  email: `doctor.${spec.toLowerCase().replace(/\s+/g, '')}@telemedicine.com`,
  password: 'doctor123',
  specialization: spec,
  status: 'ACTIVE',
}));

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    // Create doctors (password hashed via pre-save hook)
    const doctors = await Doctor.insertMany(
      await Promise.all(
        SEED_DOCTORS.map(async (d) => ({ ...d, password: await bcrypt.hash(d.password, 10) }))
      ),
      { ordered: true }
    );

    console.log(`Created ${doctors.length} doctors:`);
    doctors.forEach((d) => console.log(`  - ${d.name} (${d.specialization}) | ${d.email}`));

    // Create admin entry (stored in env or printed for reference)
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    console.log('\nAdmin credentials:');
    console.log('  Email: admin@telemedicine.com');
    console.log('  Password: admin123');
    console.log(`  Password hash (set as ADMIN_PASSWORD_HASH in .env): ${adminPasswordHash}`);

    await mongoose.disconnect();
    console.log('\nSeed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
