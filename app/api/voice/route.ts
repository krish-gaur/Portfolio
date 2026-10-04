export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional server-side TTS. Audio is never sent to a third party from the browser.
 * Without a key the client gracefully falls back to the browser's speechSynthesis API.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ provider: "browser-native", available: false }, { status: 501 });
  }

  try {
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== "string" || !body.text.trim()) {
      return Response.json({ error: "Text is required." }, { status: 400 });
    }

    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "alloy",
        input: body.text.slice(0, 1200),
        response_format: "mp3"
      }),
      cache: "no-store"
    });

    if (!upstream.ok) return Response.json({ error: "Speech provider unavailable." }, { status: 502 });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Voice-Provider": "openai"
      }
    });
  } catch {
    return Response.json({ error: "Speech could not be generated." }, { status: 500 });
  }
}
