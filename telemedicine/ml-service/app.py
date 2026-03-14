import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

import model as ml_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Ensure the model is available at startup (trains automatically if missing)
logger.info("Initializing ML model…")
try:
    if not os.path.exists(ml_model.MODEL_PATH):
        logger.info("model.pkl not found - training now…")
        ml_model.train_and_save()
        logger.info("Training complete.")
    # Warm-up load to catch any persistence issues early
    ml_model.load_model()
    logger.info("Model loaded successfully.")
    _model_status = "loaded"
except Exception as exc:
    logger.error("Failed to initialise model: %s", exc)
    _model_status = "error"


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": _model_status})


@app.post("/predict")
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    # ── Validate required fields ──────────────────────────────────────────────
    required = ("age", "emergencyLevel", "previousVisits", "visitType")
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        age = float(data["age"])
        emergency_level = float(data["emergencyLevel"])
        previous_visits = float(data["previousVisits"])
        visit_type = str(data["visitType"])
    except (TypeError, ValueError):
        return jsonify({"error": "age, emergencyLevel and previousVisits must be numeric"}), 400

    # ── Range validation ──────────────────────────────────────────────────────
    errors = []
    if not (1 <= age <= 120):
        errors.append("age must be between 1 and 120")
    if not (1 <= emergency_level <= 5):
        errors.append("emergencyLevel must be between 1 and 5")
    if previous_visits < 0:
        errors.append("previousVisits must be 0 or greater")
    if errors:
        return jsonify({"error": "; ".join(errors)}), 400

    # ── Predict ───────────────────────────────────────────────────────────────
    try:
        predicted_duration = ml_model.predict(age, emergency_level, previous_visits, visit_type)
    except Exception as exc:
        logger.error("Prediction error: %s", exc)
        return jsonify({"error": "Prediction failed – please try again"}), 500

    return jsonify({"predictedDuration": predicted_duration})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
