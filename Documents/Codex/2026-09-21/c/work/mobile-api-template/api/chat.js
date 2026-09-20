export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const defaultModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Missing OPENAI_API_KEY" }));
    return;
  }

  let raw = "";
  for await (const chunk of req) raw += chunk;

  let payload;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  const message = String(payload.message || "").trim();
  if (!message) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Message is required" }));
    return;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: payload.model || defaultModel,
      input: message
    })
  });

  const data = await response.json();
  if (!response.ok) {
    res.statusCode = response.status;
    res.end(JSON.stringify({
      error: data?.error?.message || "OpenAI request failed",
      raw: data
    }));
    return;
  }

  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item?.content || [])
      .filter((part) => part?.type === "output_text")
      .map((part) => part?.text || "")
      .join("") ||
    "";

  res.statusCode = 200;
  res.end(JSON.stringify({ text, raw: data }));
}
