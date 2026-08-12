/**
 * Next.js API Route: POST /api/predict
 *
 * Proxies AI prediction requests from the browser to the internal
 * FastAPI AI service (localhost:8000). The AI service is never
 * exposed directly to the browser.
 *
 * Body: { type: "shortage" | "leak" | "pump", payload: {...} }
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const ENDPOINT_MAP = {
  shortage: '/predict-shortage',
  leak:     '/predict-leak',
  pump:     '/predict-pump-control',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (!type || !ENDPOINT_MAP[type]) {
      return Response.json(
        { error: `Unknown prediction type: "${type}". Must be shortage | leak | pump` },
        { status: 400 }
      );
    }

    const aiUrl = `${AI_SERVICE_URL}${ENDPOINT_MAP[type]}`;

    const aiResponse = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // 5-second timeout — don't block the UI if AI is slow
      signal: AbortSignal.timeout(5000),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return Response.json(
        { error: `AI service error (${aiResponse.status}): ${errText}` },
        { status: aiResponse.status }
      );
    }

    const result = await aiResponse.json();
    return Response.json(result);

  } catch (err) {
    // Service is down or timed out — return a structured error so
    // the frontend can show a graceful "AI offline" fallback.
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    return Response.json(
      {
        error: isTimeout
          ? 'AI service timed out'
          : `AI service unreachable: ${err.message}`,
        offline: true,
      },
      { status: 503 }
    );
  }
}
