import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';
const GROQ_TIMEOUT_MS = 15000;

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

const buildPrompt = (symptoms, age, gender, visitType) => `
You are a medical triage AI. Based on the patient information below, respond with ONLY a valid JSON object and nothing else.

Patient Info:
- Age: ${age}
- Gender: ${gender}
- Visit Type: ${visitType}
- Symptoms: ${symptoms}

Return this exact JSON structure:
{
  "emergencyLevel": <integer 1-5 where 1=minor, 5=life-threatening>,
  "doctorSpecialization": "<one of: Cardiologist, Neurologist, Orthopedic, Dermatologist, General Physician, Pulmonologist, Gastroenterologist, Psychiatrist>",
  "isCriticalOperationToday": <true or false>
}

Rules:
- emergencyLevel 5 means immediate life-threatening risk
- emergencyLevel 1 means routine/minor issue
- Choose the most appropriate specialization based on symptoms
- isCriticalOperationToday is true only if symptoms suggest a procedure is urgently needed today
- Return ONLY the JSON object, no explanation
`.trim();

const triagePatient = async ({ symptoms, age, gender, visitType }) => {
  const defaultResult = {
    emergencyLevel: 1,
    doctorSpecialization: 'General Physician',
    isCriticalOperationToday: false,
  };

  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not set, using default triage result');
    return defaultResult;
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: buildPrompt(symptoms, age, gender, visitType),
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: GROQ_TIMEOUT_MS,
      }
    );

    const content = response.data.choices?.[0]?.message?.content?.trim();
    if (!content) return defaultResult;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('AI triage: no JSON found in response:', content);
      return defaultResult;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const emergencyLevel = Math.min(5, Math.max(1, parseInt(parsed.emergencyLevel) || 1));
    const doctorSpecialization = SPECIALIZATIONS.includes(parsed.doctorSpecialization)
      ? parsed.doctorSpecialization
      : 'General Physician';
    const isCriticalOperationToday = Boolean(parsed.isCriticalOperationToday);

    return { emergencyLevel, doctorSpecialization, isCriticalOperationToday };
  } catch (err) {
    console.error('AI triage error:', err.message);
    return defaultResult;
  }
};

export default { triagePatient };
