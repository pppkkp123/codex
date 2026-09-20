export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Missing OPENAI_API_KEY" }));
    return;
  }

  const response = await fetch("https://api.openai.com/v1/me", {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    res.statusCode = response.status;
    res.end(JSON.stringify({
      error: data?.error?.message || "OpenAI /v1/me failed",
      code: data?.error?.code || null,
      type: data?.error?.type || null,
      raw: data
    }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    id: data.id,
    email: data.email,
    orgs: Array.isArray(data.orgs?.data)
      ? data.orgs.data.map((org) => ({
          id: org.id,
          title: org.title
        }))
      : []
  }));
}
