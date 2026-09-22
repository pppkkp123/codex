const modeEl = document.getElementById("mode");
const promptEl = document.getElementById("prompt");
const imageFieldEl = document.getElementById("image-field");
const imageFileEl = document.getElementById("image-file");
const imagePreviewEl = document.getElementById("image-preview");
const textModelEl = document.getElementById("text-model");
const imageModelEl = document.getElementById("image-model");
const imageSizeEl = document.getElementById("image-size");
const outputEl = document.getElementById("output");
const generatedPreviewEl = document.getElementById("generated-preview");
const sendChatEl = document.getElementById("send-chat");
const sendVisionEl = document.getElementById("send-vision");
const sendImageEl = document.getElementById("send-image");

function initButton(button) {
  button.dataset.label = button.textContent;
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.textContent = busy ? "Working..." : button.dataset.label;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.raw?.error?.message || data.error || "Request failed");
  }
  return data;
}

function updateModeUI() {
  const mode = modeEl.value;
  imageFieldEl.classList.toggle("hidden", mode !== "vision");
  sendChatEl.classList.toggle("primary", mode === "chat");
  sendVisionEl.classList.toggle("primary", mode === "vision");
  sendImageEl.classList.toggle("primary", mode === "image");
}

initButton(sendChatEl);
initButton(sendVisionEl);
initButton(sendImageEl);
updateModeUI();

modeEl.addEventListener("change", updateModeUI);

imageFileEl.addEventListener("change", async () => {
  const file = imageFileEl.files?.[0];
  if (!file) {
    imagePreviewEl.classList.add("hidden");
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  imagePreviewEl.src = dataUrl;
  imagePreviewEl.classList.remove("hidden");
});

sendChatEl.addEventListener("click", async () => {
  const message = promptEl.value.trim();
  if (!message) {
    outputEl.textContent = "請先輸入內容";
    return;
  }

  setBusy(sendChatEl, true);
  outputEl.textContent = "thinking...";
  generatedPreviewEl.classList.add("hidden");

  try {
    const data = await postJson("/api/chat", {
      model: textModelEl.value.trim(),
      message
    });
    outputEl.textContent = data.text || "(empty response)";
  } catch (err) {
    outputEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(sendChatEl, false);
  }
});

sendVisionEl.addEventListener("click", async () => {
  const file = imageFileEl.files?.[0];
  if (!file) {
    outputEl.textContent = "請先選擇圖片";
    return;
  }

  setBusy(sendVisionEl, true);
  outputEl.textContent = "analyzing...";
  generatedPreviewEl.classList.add("hidden");

  try {
    const imageDataUrl = await readFileAsDataUrl(file);
    const data = await postJson("/api/analyze-image", {
      model: textModelEl.value.trim(),
      message: promptEl.value.trim(),
      imageDataUrl
    });
    outputEl.textContent = data.text || "(empty response)";
  } catch (err) {
    outputEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(sendVisionEl, false);
  }
});

sendImageEl.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    outputEl.textContent = "請先輸入圖片描述";
    return;
  }

  setBusy(sendImageEl, true);
  outputEl.textContent = "generating...";
  generatedPreviewEl.classList.add("hidden");

  try {
    const data = await postJson("/api/generate-image", {
      model: imageModelEl.value.trim(),
      prompt,
      size: imageSizeEl.value.trim()
    });
    if (data.imageUrl) {
      generatedPreviewEl.src = data.imageUrl;
      generatedPreviewEl.classList.remove("hidden");
      outputEl.textContent = "Done";
    } else {
      outputEl.textContent = data.text || "(empty response)";
    }
  } catch (err) {
    outputEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(sendImageEl, false);
  }
});
