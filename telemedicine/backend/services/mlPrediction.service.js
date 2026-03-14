import axios from 'axios';

const DEFAULT_DURATION = 15;
const ML_TIMEOUT_MS = 5000;

const predictDuration = async ({ age, emergencyLevel, previousVisits, visitType }) => {
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';

  try {
    const response = await axios.post(
      `${mlUrl}/predict`,
      { age, emergencyLevel, previousVisits, visitType },
      { timeout: ML_TIMEOUT_MS }
    );

    const duration = parseInt(response.data?.predictedDuration);
    if (!isNaN(duration) && duration > 0) return duration;

    return DEFAULT_DURATION;
  } catch (err) {
    console.warn('ML prediction service unavailable, using fallback duration:', err.message);
    return DEFAULT_DURATION;
  }
};

export default { predictDuration };
