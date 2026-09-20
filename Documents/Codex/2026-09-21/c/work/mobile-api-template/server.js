import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const defaultModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const html = await readFile(path.join(__dirname, "public", "index.html"), "utf8");
const css = await readFile(path.join(__dirname, "public", "styles.css"), "utf8");
const js = await readFile(path.join(__dirname, "public", "app.js"), "utf8");

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function json(res, status, body) {
  send(res, status, JSON.stringify(body), "application/json; charset=utf-8");
}

async function handleChat(req, res) {
  if (!apiKey) {
    return json(res, 500, { error: "Missing OPENAI_API_KEY" });
  }

  let raw = "";
  for await (const chunk of req) raw += chunk;

  let payload;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }

  const message = String(payload.message || "").trim();
  if (!message) {
    return json(res, 400, { error: "Message is required" });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: payload.model || defaultModel,
      input: message
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return json(res, response.status, {
      error: data?.error?.message || "OpenAI request failed",
      raw: data
    });
  }

  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item?.content || [])
      .filter((part) => part?.type === "output_text")
      .map((part) => part?.text || "")
      .join("") ||
    "";
  return json(res, 200, { text, raw: data });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/") {
    return send(res, 200, html, "text/html; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/styles.css") {
    return send(res, 200, css, "text/css; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/app.js") {
    return send(res, 200, js, "application/javascript; charset=utf-8");
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    return handleChat(req, res);
  }

  return send(res, 404, "Not found");
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
