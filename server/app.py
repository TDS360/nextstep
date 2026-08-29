"""
Optional local AI backend for EcoRisk Live — Feature 3.

This is a fixed/structured version of the Ollama script: the
original had two bugs that would crash it immediately —
`generat` was never called with the right signature, and
`f"...{}."` is invalid (an f-string placeholder needs a value
inside the braces, e.g. f"...{air_quality}.").

This is entirely OPTIONAL. The app already works with zero
backend via a rule-based generator (src/lib/ai.js) that runs
in the browser — that's what a deployed/judged site actually
uses. Run this only if you want richer, natural-language output
during local development or a live demo where you control the
machine.

SETUP:
  1. Install Ollama:      https://ollama.com/download
  2. Pull the model:      ollama pull llama3.2:1b
  3. pip install -r requirements.txt
  4. python app.py                        (runs on :5001)
  5. In the project root, create .env.local with:
       VITE_AI_API_URL=http://localhost:5001/api/ai-insights
     src/lib/ai.js automatically falls back to the rule-based
     generator if this isn't set, or if this server isn't
     reachable — so it's safe to leave off entirely.
"""

import json

import ollama
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the Vite dev server (localhost:5173) to call this

MODEL = "llama3.2:1b"


def build_prompt(environmental, risk, simulation):
    """Turns the app's data objects into one prompt, and asks the
    model to reply with ONLY a JSON object shaped like the `ai`
    section of src/data.js — so this file can hand the response
    straight back to the frontend with no extra parsing on either
    side."""
    return f"""You are an environmental health assistant. Based on the
data below, respond with ONLY a JSON object (no markdown, no code
fences, no extra text) with these exact keys:
  "mainConcern": one sentence naming the single biggest concern
  "contributingFactors": array of 2-3 short strings
  "recommendations": array of 2-3 short, actionable strings
  "simulationExplanation": one sentence, or null if simulation data is missing

DATA:
  Air Quality Index (AQI): {environmental.get("aqi")}
  AQI category: {environmental.get("aqiLabel")}
  PM2.5: {environmental.get("pm25")} micrograms/m3
  Temperature: {environmental.get("temperature")} F (feels like {environmental.get("feelsLike")} F)
  Tree coverage: {environmental.get("treeCoverage")} percent
  Air risk score: {risk.get("airRisk")} / 100
  Heat risk score: {risk.get("heatRisk")} / 100
  Overall risk score: {risk.get("overallRisk")} / 100
  Simulated risk after +10% tree coverage: {simulation.get("simulatedRisk")} / 100
"""


def generate_insights(environmental, risk, simulation):
    """Calls the local Ollama model and returns the parsed dict.
    Raises on any failure (Ollama not running, bad JSON from the
    model, etc.) — the route below turns that into an HTTP error,
    and the frontend turns THAT into a fallback to the rule-based
    generator, so the UI never breaks."""
    prompt = build_prompt(environmental, risk, simulation)

    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response["message"]["content"].strip()
    return json.loads(raw)


@app.route("/api/ai-insights", methods=["POST"])
def ai_insights():
    body = request.get_json(force=True) or {}
    environmental = body.get("environmental") or {}
    risk = body.get("risk") or {}
    simulation = body.get("simulation") or {}

    try:
        insights = generate_insights(environmental, risk, simulation)
        return jsonify(insights)
    except Exception as error:  # Ollama down, model not pulled, bad JSON, etc.
        return jsonify({"error": str(error)}), 502


if __name__ == "__main__":
    app.run(port=5001, debug=True)