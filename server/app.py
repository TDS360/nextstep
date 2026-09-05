"""
AI backend for EcoRisk Live -- Feature 3.

Uses OpenAI's API (the model behind ChatGPT) instead of a local
Ollama model. Simpler than Ollama: no multi-gigabyte model
download, no separate "ollama serve" process to keep running --
just an API key. It costs a small amount per request (gpt-4o-mini
is cheap: a fraction of a cent per exchange for this app's usage).

This still needs to run SOMEWHERE the frontend can reach it over
the network -- your own machine during development/demos, or a
real hosted server if you want it live for the public. A static
site like GitHub Pages cannot run this by itself.

SETUP:
  1. Get an API key: https://platform.openai.com/api-keys
  2. pip install -r requirements.txt
  3. Create a file named .env in this server/ folder containing:
       OPENAI_API_KEY=sk-...your-key-here...
     NEVER commit this file or put the key in any frontend code --
     anyone who saw it could run up charges on your account. This
     project's .gitignore already excludes .env, but double-check
     before pushing.
  4. python app.py                        (runs on :5001)
  5. In the project ROOT (not this server folder), create
     .env.local containing:
       VITE_AI_API_URL=http://localhost:5001/api/ai-insights
     src/lib/ai.js automatically falls back to the rule-based
     generator if this isn't set, or if this server isn't
     reachable -- so it's safe to leave off entirely.
"""

import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)  # allow the Vite dev server (localhost:5173) to call this

MODEL = "gpt-4o-mini"  # fast and cheap; swap for "gpt-4o" for higher quality

_client = None


def get_client():
    """Created lazily, on the first actual request, instead of at
    import time -- so a missing/blank API key produces a normal
    502 error the frontend already knows how to catch and fall
    back from, instead of crashing the whole Flask process before
    it can even start serving requests."""
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Create server/.env with "
                "OPENAI_API_KEY=sk-... (see the setup notes at the top of this file)."
            )
        _client = OpenAI(api_key=api_key)
    return _client


def build_prompt(environmental, safety, simulation):
    """Turns the app's data objects into one prompt, and asks the
    model to reply with ONLY a JSON object shaped like the `ai`
    section of src/data.js -- so this file can hand the response
    straight back to the frontend with no extra parsing on either
    side."""
    return f"""You are an environmental health assistant. Based on the
    data below, respond with ONLY a JSON object (no markdown, no code
    fences, no extra text) with these exact keys:
     "mainConcern": one sentence naming the single biggest concern
    "contributingFactors": array of 2-3 short strings
    "recommendations": array of 2-3 short, actionable, PERSONAL safety
    steps (things the person can do right now to protect themselves)
    "environmentalActions": array of 2-3 short, actionable, REALISTIC
    community/environmental steps (things that would improve local
    conditions over time, e.g. supporting tree-planting programs,
    reducing vehicle emissions, avoiding burning yard waste)
  "simulationExplanation": one sentence, or null if simulation data is missing

DATA:
  Air Quality Index (AQI): {environmental.get("aqi")}
  AQI category: {environmental.get("aqiLabel")}
  PM2.5: {environmental.get("pm25")} micrograms/m3
  Temperature: {environmental.get("temperature")} F (feels like {environmental.get("feelsLike")} F)
  Tree coverage: {environmental.get("treeCoverage")} percent

  Scores below are SAFETY scores: 100 = best/safest conditions,
  0 = worst. Higher is always better.
  Air safety score: {safety.get("airSafety")} / 100
  Heat safety score: {safety.get("heatSafety")} / 100
  Overall safety score: {safety.get("overallSafety")} / 100
  Simulated safety after +10% tree coverage: {simulation.get("simulatedSafety")} / 100
"""


def generate_insights(environmental, safety, simulation):
    """Calls OpenAI and returns the parsed dict. Raises on any
    failure (no API key, bad JSON, rate limit, etc.) -- the route
    below turns that into an HTTP error, and the frontend turns
    THAT into a fallback to the rule-based generator, so the UI
    never breaks."""
    prompt = build_prompt(environmental, safety, simulation)

    response = get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},  # guarantees valid JSON back, unlike Ollama
    )

    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


@app.route("/api/ai-insights", methods=["POST"])
def ai_insights():
    body = request.get_json(force=True) or {}
    environmental = body.get("environmental") or {}
    safety = body.get("safety") or {}
    simulation = body.get("simulation") or {}

    try:
        insights = generate_insights(environmental, safety, simulation)
        return jsonify(insights)
    except Exception as error:  # no API key, bad JSON, rate limit, etc.
        return jsonify({"error": str(error)}), 502


@app.route("/api/chat", methods=["POST"])
def chat():
    """Free-form follow-up chat about a location's data. Returns
    plain text, not structured JSON -- there is deliberately NO
    rule-based fallback for this route on the frontend (see
    src/lib/ai.js's fetchChatReply): a template can't hold a real
    conversation. If this fails, the chat UI shows a clear
    "unavailable" state instead of a fake reply."""
    body = request.get_json(force=True) or {}
    messages = body.get("messages") or []
    context = body.get("context") or {}

    system_prompt = (
        "You are a friendly environmental health assistant. You must ground "
        "every answer STRICTLY in the data provided below -- never invent "
        "numbers, locations, health claims, or facts that aren't in it. This "
        "is the only data you have for the person's searched location "
        "(JSON): "
        + json.dumps(context)
        + ". If a question genuinely cannot be answered from this data "
        "(e.g. they ask about a different city, a health condition, or "
        "something this dashboard doesn't track), say plainly that you "
        "don't have that information here, and suggest a real resource: "
        "airnow.gov for current US air quality alerts, their local health "
        "department for health-specific questions, or 911/local emergency "
        "services for a genuine emergency. Never guess to fill the gap. "
        "Answer directly and concisely (2-4 sentences unless they ask for "
        "more detail). Don't restate the raw JSON back at them."
    )

    openai_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        response = get_client().chat.completions.create(model=MODEL, messages=openai_messages)
        return jsonify({"reply": response.choices[0].message.content.strip()})
    except Exception as error:
        return jsonify({"error": str(error)}), 502


if __name__ == "__main__":
    app.run(port=5001, debug=True)