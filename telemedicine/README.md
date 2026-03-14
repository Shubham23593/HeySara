# 🏥 Telemedicine Queue Optimization System

A smart telemedicine platform with AI-based symptom triage, machine learning consultation time prediction, real-time queue optimization, and video/chat consultations.

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js (JSX), Plain CSS, React Router, Axios, Socket.io-client, Chart.js, WebRTC |
| **Backend** | Node.js, Express.js, Socket.io, JWT Auth, MongoDB, Mongoose |
| **AI Service** | Groq API (`llama3-8b-8192`) — symptom triage |
| **ML Service** | Python Flask, scikit-learn `RandomForestRegressor` — consultation duration prediction |

---

## 🏗 Architecture

```
React Frontend (port 3000)
      │
      ▼
Node.js API Server (port 5000)
      │
      ├── MongoDB (port 27017)
      │
      ├── Groq AI API (external)
      │
      ├── Flask ML Service (port 5001)
      │
      └── Socket.io Real-Time Server
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Groq API key ([get one free](https://console.groq.com))

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm install
npm run dev
```

Seed sample doctors and admin:
```bash
npm run seed
```

**Seed credentials:**
- Admin: `admin@telemedicine.com` / `admin123`
- Doctors: `<specialization>@telemedicine.com` / `doctor123` (e.g., `cardiologist@telemedicine.com`)

### 2. ML Service

```bash
cd ml-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Model trains automatically on first run
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables (Backend)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/telemedicine
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
ML_SERVICE_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:3000
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register patient or doctor |
| POST | `/api/auth/login` | Login and receive JWT |

### Patient
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patient/join-queue` | Submit symptoms → AI triage → ML prediction → queue assignment |
| GET | `/api/patient/status/:patientId` | Get queue status |
| POST | `/api/patient/urgent-request` | Emergency urgent request |
| GET | `/api/patient/queue-position/:patientId` | Queue position |

### Doctor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctor/queue` | Get doctor's patient queue |
| POST | `/api/doctor/status` | Toggle ACTIVE/INACTIVE |
| POST | `/api/doctor/start-session/:patientId` | Start consultation |
| POST | `/api/doctor/end-session/:patientId` | End consultation |
| POST | `/api/doctor/accept-urgent/:patientId` | Accept urgent request |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | All stats |
| GET | `/api/admin/doctors` | All doctors |
| GET | `/api/admin/queues` | All queues |
| GET | `/api/admin/analytics` | Analytics (FIFO vs optimized) |

### Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue/live` | Live queue for all specializations |
| POST | `/api/queue/recalculate` | Recalculate all queues |

### ML Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` (port 5001) | Predict consultation duration |
| GET | `/health` (port 5001) | Health check |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `queueUpdated` | Server → Client | Queue state broadcast |
| `doctorStatusChanged` | Server → Client | Doctor online/offline |
| `consultationStarted` | Server → Client | Consultation begins |
| `consultationEnded` | Server → Client | Consultation ends |
| `newPatientJoined` | Server → Client | New patient in queue |
| `patientReassigned` | Server → Client | Patient moved to another doctor |
| `criticalAlert` | Server → Admin | Critical surge alert |
| `urgentRequest` | Server → Doctors | Patient urgent request |
| `notification` | Server → Client | General notification |
| `chatMessage` | Bidirectional | Real-time chat |
| `videoSignal` | Bidirectional | WebRTC signaling (offer/answer/ICE) |

---

## 🤖 AI + ML Pipeline

### Step 1 — AI Triage (Groq API)
Patient symptoms → `llama3-8b-8192` → `{ emergencyLevel, doctorSpecialization, isCriticalOperationToday }`

### Step 2 — ML Prediction (Flask)
`{ age, emergencyLevel, previousVisits, visitType }` → RandomForestRegressor → `predictedDuration (minutes)`

---

## ⚙️ Queue Optimization Algorithm

**Priority Score:**
```
PriorityScore = (emergencyLevel² × 10) + (waitingTimeMinutes × 1) + (previousVisits × 2)
```

**Starvation Prevention:** Every 5 minutes, `PriorityScore += 1` for all waiting patients.

**Load Balancing:** 4+ simultaneous emergencies → auto-reassign overflow to same-spec or GP doctors → CRITICAL SURGE admin alert.

**Doctor Inaction Detection:** 3 minutes without starting session → notify doctor → alert admin → auto-reassign patient.

**Cascade Effect:** `actualDuration > predictedDuration` → recalculate queue → broadcast updated wait times.

---

## 💬 Consultation Modes
- **Chat** — Real-time messaging via Socket.io
- **Video** — WebRTC peer-to-peer with ICE/STUN signaling

---

## 📊 Admin Analytics
- FIFO vs Optimized queue comparison (line chart)
- Average wait time by emergency level (bar chart)
- Emergency level distribution (pie chart)
- Doctor queue lengths (bar chart)
- KPIs: Avg Wait Time, Max Wait Time, Doctor Idle Time, Patient Throughput
