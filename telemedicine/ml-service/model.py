import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")


def _encode_visit_type(visit_type: str) -> int:
    """Encode visitType: Follow-up=1, anything else (Checkup/New)=0."""
    return 1 if str(visit_type).strip().lower() == "follow-up" else 0


def _generate_training_data(n_samples: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic training data with realistic clinical patterns."""
    rng = np.random.default_rng(seed)

    age = rng.integers(1, 121, size=n_samples).astype(float)  # upper bound exclusive → max age 120
    emergency_level = rng.integers(1, 6, size=n_samples).astype(float)
    previous_visits = rng.integers(0, 21, size=n_samples).astype(float)
    visit_type_encoded = rng.integers(0, 2, size=n_samples).astype(float)

    # Base duration driven by emergency level (5–45 min range)
    base_duration = 5 + (emergency_level - 1) * 10  # 5, 15, 25, 35, 45

    # Age contribution: older patients add up to ~8 min
    age_factor = (age / 120) * 8

    # Follow-up visits are slightly shorter (−3 min)
    followup_factor = visit_type_encoded * -3

    # More previous visits → slightly longer (up to ~4 min)
    history_factor = (previous_visits / 20) * 4

    # Gaussian noise
    noise = rng.normal(0, 3, size=n_samples)

    duration = base_duration + age_factor + followup_factor + history_factor + noise
    duration = np.clip(duration, 5, 90)  # keep durations in a realistic range

    return pd.DataFrame(
        {
            "age": age,
            "emergencyLevel": emergency_level,
            "previousVisits": previous_visits,
            "visitType_encoded": visit_type_encoded,
            "duration": duration,
        }
    )


def train_and_save() -> RandomForestRegressor:
    """Train the RandomForestRegressor on synthetic data and persist it."""
    df = _generate_training_data()

    feature_cols = ["age", "emergencyLevel", "previousVisits", "visitType_encoded"]
    X = df[feature_cols].values
    y = df["duration"].values

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    return model


def load_model() -> RandomForestRegressor:
    """Load model from disk, training it first if necessary."""
    if not os.path.exists(MODEL_PATH):
        train_and_save()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def predict(age: float, emergency_level: float, previous_visits: float, visit_type: str) -> float:
    """Return predicted consultation duration in minutes."""
    model = load_model()
    visit_type_encoded = _encode_visit_type(visit_type)
    features = np.array([[age, emergency_level, previous_visits, visit_type_encoded]])
    result = model.predict(features)
    return float(round(result[0], 2))
