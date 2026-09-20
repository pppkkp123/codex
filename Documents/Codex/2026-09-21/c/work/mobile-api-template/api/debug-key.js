export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const rawKey = process.env.CGU_API_KEY || "";
  const apiKey = rawKey.trim();
  const prefix = apiKey.slice(0, 3);
  const suffix = apiKey.slice(-4);

  res.statusCode = 200;
  res.end(JSON.stringify({
    present: Boolean(apiKey),
    rawLength: rawKey.length,
    trimmedLength: apiKey.length,
    prefix,
    suffix,
    env: process.env.VERCEL_ENV || "unknown"
  }));
}
