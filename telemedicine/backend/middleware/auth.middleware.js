import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;
    if (decoded.role === 'doctor') {
      user = await Doctor.findById(decoded.id).select('-password');
    } else if (decoded.role === 'patient') {
      user = await Patient.findById(decoded.id).select('-password');
    } else if (decoded.role === 'admin') {
      user = { _id: decoded.id, role: 'admin', email: decoded.email };
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

export default authMiddleware;
