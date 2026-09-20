export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const apiKey = (process.env.CGU_API_KEY || "").trim();
  const baseUrl = (process.env.CGU_BASE_URL || "https://air.cgu.edu.tw/cgullmapi/v1").replace(/\/+$/, "");

  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Missing CGU_API_KEY" }));
    return;
  }

  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    res.statusCode = response.status;
    res.end(JSON.stringify({
      error: data?.error?.message || "Gateway /models failed",
      code: data?.error?.code || null,
      type: data?.error?.type || null,
      raw: data
    }));
    return;
  }

  const models = Array.isArray(data?.data)
    ? data.data.map((model) => ({
        id: model.id,
        owned_by: model.owned_by
      }))
    : [];

  res.statusCode = 200;
  res.end(JSON.stringify({ models }));
}
