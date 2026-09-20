export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const apiKey = (process.env.CGU_API_KEY || "").trim();
  const baseUrl = (process.env.CGU_BASE_URL || "https://air.cgu.edu.tw/cgullmapi/v1").replace(/\/+$/, "");
  const defaultModel = process.env.CGU_IMAGE_MODEL || "gpt-image-1";

  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Missing CGU_API_KEY" }));
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

  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Prompt is required" }));
    return;
  }

  const model = String(payload.model || defaultModel).trim();
  const size = String(payload.size || "1024x1024").trim();

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    res.statusCode = response.status;
    res.end(JSON.stringify({
      error: data?.error?.message || "Gateway image generation failed",
      code: data?.error?.code || null,
      type: data?.error?.type || null,
      raw: data
    }));
    return;
  }

  const imageUrl =
    data.data?.[0]?.url ||
    (data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : "");

  res.statusCode = 200;
  res.end(JSON.stringify({ imageUrl, raw: data }));
}
