# CGU AI Gateway Template

最小可用的手機網頁版範本。前端是一個單一輸入區，後端會用學校提供的 `CGU_API_KEY` 呼叫 `https://air.cgu.edu.tw/cgullmapi/v1`，支援文字、圖片問答、圖片生成。

## Deploy to Vercel

1. 把這個資料夾推到 GitHub。
2. 在 Vercel 匯入專案。
3. 到 Project Settings 設定環境變數 `CGU_API_KEY`，可選 `CGU_BASE_URL`、`CGU_MODEL`、`CGU_VISION_MODEL` 和 `CGU_IMAGE_MODEL`。
4. 部署完成後，用 Vercel 給你的公開網址，手機直接打開就能用。

## Local test

```powershell
$env:CGU_API_KEY="你的key"
npx vercel dev
```

## Notes

- key 只放在 Vercel 環境變數，不要寫進前端。
- `index.html`、`styles.css`、`app.js` 是前端，`api/*.js` 是後端。

## Temporary debug

Open `/api/debug-key` to confirm which key Vercel is actually reading. It only shows masked info and should be removed after troubleshooting.

Open `/api/models` to list the models exposed by the CGU Gateway.
