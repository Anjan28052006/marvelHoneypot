require('dotenv').config();
const axios = require('axios');
const db = require('../db/init');

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const CANDIDATE_MODELS = [
  PRIMARY_MODEL,
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
];

const SYSTEM_INSTRUCTION = `You are a security analyst. You will be given a list of shell commands typed by an unknown user into a honeypot.
Analyze the activity and return ONLY a valid JSON object matching this schema:
{
  "intent": "reconnaissance | credential_theft | malware_deployment | unknown",
  "skill_level": "low | medium | high",
  "automated": true,
  "mitre_techniques": ["T1059"],
  "risk_score": 7,
  "confidence": 0.85,
  "summary": "one or two plain English sentences"
}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(modelName, commandList, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        parts: [{ text: `Commands executed in honeypot session:\n${commandList}` }],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.2,
    },
  };

  const response = await axios.post(endpoint, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  // Handle potential markdown backticks if returned
  const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}

async function analyseSession(sessionId, commandList = 'No commands captured') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[AI] GEMINI_API_KEY is missing in .env');
    return null;
  }

  let parsed = null;
  let usedModel = null;
  let lastError = null;

  // Try candidate models with fast fallback on high demand / rate limits
  for (const model of CANDIDATE_MODELS) {
    try {
      parsed = await callGemini(model, commandList, apiKey);
      usedModel = model;
      break;
    } catch (err) {
      lastError = err.response?.data?.error?.message || err.message;
      const isRetryable =
        lastError.includes('high demand') ||
        lastError.includes('Resource has been exhausted') ||
        lastError.includes('503') ||
        lastError.includes('429');

      console.warn(`[AI] Model ${model} failed (${lastError}).${isRetryable ? ' Attempting fallback model...' : ''}`);
      if (isRetryable) {
        await sleep(500);
      }
    }
  }

  if (!parsed) {
    console.error(`[AI] All candidate models failed for session ${sessionId}. Last error: ${lastError}`);
    return null;
  }

  try {
    const insertQuery = `
      INSERT INTO ai_summary (session_id, intent, skill_level, automated, risk_score, confidence, summary, raw_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (session_id) DO UPDATE SET
        intent = EXCLUDED.intent,
        skill_level = EXCLUDED.skill_level,
        automated = EXCLUDED.automated,
        risk_score = EXCLUDED.risk_score,
        confidence = EXCLUDED.confidence,
        summary = EXCLUDED.summary,
        raw_json = EXCLUDED.raw_json
      RETURNING *;
    `;

    const values = [
      sessionId,
      parsed.intent || 'unknown',
      parsed.skill_level || 'low',
      Boolean(parsed.automated),
      parsed.risk_score || 0,
      parsed.confidence || 0.0,
      parsed.summary || '',
      JSON.stringify(parsed),
    ];

    const result = await db.query(insertQuery, values);
    console.log(`[AI] Session ${sessionId} classified via ${usedModel}. Risk score: ${parsed.risk_score}`);
    return result.rows[0];
  } catch (dbErr) {
    console.error('[AI] Database insertion failed:', dbErr.message);
    return null;
  }
}

module.exports = analyseSession;