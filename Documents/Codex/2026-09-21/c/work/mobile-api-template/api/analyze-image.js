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
  const defaultModel = process.env.CGU_VISION_MODEL || process.env.CGU_MODEL || "gpt-4.1-mini";

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

  const imageDataUrl = String(payload.imageDataUrl || "").trim();
  if (!imageDataUrl) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Image is required" }));
    return;
  }

  const message = String(payload.message || "請描述這張圖片。").trim() || "請描述這張圖片。";
  const model = String(payload.model || defaultModel).trim();

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: message },
            { type: "input_image", image_url: imageDataUrl, detail: "auto" }
          ]
        }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    res.statusCode = response.status;
    res.end(JSON.stringify({
      error: data?.error?.message || "Gateway request failed",
      code: data?.error?.code || null,
      type: data?.error?.type || null,
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
