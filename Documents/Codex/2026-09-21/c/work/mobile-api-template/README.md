# Mobile API Template

最小可用的手機網頁版範本。前端是靜態頁，後端是 Vercel `/api/chat` function，共用同一組 `OPENAI_API_KEY`。

## Deploy to Vercel

1. 把這個資料夾推到 GitHub。
2. 在 Vercel 匯入專案。
3. 到 Project Settings 設定環境變數 `OPENAI_API_KEY`，可選 `OPENAI_MODEL`。
4. 部署完成後，用 Vercel 給你的公開網址，手機直接打開就能用。

## Local test

```powershell
$env:OPENAI_API_KEY="你的key"
npx vercel dev
```

## Notes

- API key 只放在 Vercel 環境變數，不要寫進前端。
- `index.html`、`styles.css`、`app.js` 是前端，`api/chat.js` 是後端。

## Temporary debug

Open `/api/debug-key` to confirm which key Vercel is actually reading. It only shows masked info and should be removed after troubleshooting.

Open `/api/whoami` to verify whether OpenAI accepts that key and which orgs it belongs to.
