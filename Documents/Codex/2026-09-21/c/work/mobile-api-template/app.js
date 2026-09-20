const modelEl = document.getElementById("model");
const messageEl = document.getElementById("message");
const outputEl = document.getElementById("output");
const sendEl = document.getElementById("send");

sendEl.addEventListener("click", async () => {
  const message = messageEl.value.trim();
  if (!message) {
    outputEl.textContent = "請先輸入內容";
    return;
  }

  sendEl.disabled = true;
  outputEl.textContent = "thinking...";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelEl.value.trim(),
        message
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.raw?.error?.message ||
        data.error ||
        "Request failed"
      );
    }
    outputEl.textContent = data.text || "(empty response)";
  } catch (err) {
    outputEl.textContent = `Error: ${err.message}`;
  } finally {
    sendEl.disabled = false;
  }
});
