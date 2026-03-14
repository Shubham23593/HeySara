import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res, next) => {
  try {
    const { role, name, email, password, ...rest } = req.body;

    if (!role || !['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be doctor or patient' });
    }

    if (role === 'doctor') {
      const exists = await Doctor.findOne({ email });
      if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

      const doctor = await Doctor.create({ name, email, password, ...rest, role: 'doctor' });
      const token = generateToken({ id: doctor._id, role: 'doctor', email });
      return res.status(201).json({
        success: true,
        token,
        user: { id: doctor._id, name, email, role: 'doctor', specialization: doctor.specialization },
      });
    }

    if (role === 'patient') {
      const exists = await Patient.findOne({ email });
      if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

      const patient = await Patient.create({ name, email, password, ...rest, role: 'patient' });
      const token = generateToken({ id: patient._id, role: 'patient', email });
      return res.status(201).json({
        success: true,
        token,
        user: { id: patient._id, name, email, role: 'patient' },
      });
    }
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Admin login
    if (role === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@telemedicine.com';
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

      if (email !== adminEmail) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      let valid = false;
      if (adminPasswordHash) {
        valid = await bcrypt.compare(password, adminPasswordHash);
      } else if (process.env.NODE_ENV !== 'production') {
        // Dev-only fallback
        valid = password === (process.env.ADMIN_PASSWORD || 'admin123');
      }

      if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken({ id: 'admin', role: 'admin', email });
      return res.json({
        success: true,
        token,
        user: { id: 'admin', email, role: 'admin' },
      });
    }

    // Doctor login
    const doctor = await Doctor.findOne({ email });
    if (doctor) {
      const match = await doctor.comparePassword(password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const token = generateToken({ id: doctor._id, role: 'doctor', email });
      return res.json({
        success: true,
        token,
        user: {
          id: doctor._id,
          name: doctor.name,
          email,
          role: 'doctor',
          specialization: doctor.specialization,
          status: doctor.status,
        },
      });
    }

    // Patient login
    const patient = await Patient.findOne({ email });
    if (patient) {
      const match = await patient.comparePassword(password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const token = generateToken({ id: patient._id, role: 'patient', email });
      return res.json({
        success: true,
        token,
        user: {
          id: patient._id,
          name: patient.name,
          email,
          role: 'patient',
          status: patient.status,
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    next(err);
  }
};
