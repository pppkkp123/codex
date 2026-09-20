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
  const defaultModel = process.env.CGU_MODEL || "gpt-4.1-mini";

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

  const message = String(payload.message || "").trim();
  if (!message) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Message is required" }));
    return;
  }

  const model = String(payload.model || defaultModel).trim();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  const responseEndpoints = [
    {
      url: `${baseUrl}/responses`,
      body: JSON.stringify({
        model,
        input: message
      }),
      parse: (data) =>
        data.output_text ||
        data.output
          ?.flatMap((item) => item?.content || [])
          .filter((part) => part?.type === "output_text")
          .map((part) => part?.text || "")
          .join("") ||
        ""
    },
    {
      url: `${baseUrl}/chat/completions`,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: message }]
      }),
      parse: (data) =>
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.delta?.content ||
        ""
    }
  ];

  let lastError = null;
  for (const endpoint of responseEndpoints) {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body: endpoint.body
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const text = endpoint.parse(data);
      res.statusCode = 200;
      res.end(JSON.stringify({ text, raw: data, endpoint: endpoint.url }));
      return;
    }

    lastError = {
      status: response.status,
      error: data?.error?.message || "Gateway request failed",
      code: data?.error?.code || null,
      type: data?.error?.type || null,
      raw: data,
      endpoint: endpoint.url
    };

    if (![404, 405].includes(response.status)) {
      break;
    }
  }

  res.statusCode = lastError?.status || 500;
  res.end(JSON.stringify({
    error: lastError?.error || "Gateway request failed",
    code: lastError?.code || null,
    type: lastError?.type || null,
    endpoint: lastError?.endpoint || null,
    raw: lastError?.raw || null
  }));
}
