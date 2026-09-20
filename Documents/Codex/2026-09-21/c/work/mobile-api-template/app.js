const chatModelEl = document.getElementById("chat-model");
const messageEl = document.getElementById("message");
const chatOutputEl = document.getElementById("chat-output");
const sendChatEl = document.getElementById("send-chat");

const visionModelEl = document.getElementById("vision-model");
const visionMessageEl = document.getElementById("vision-message");
const visionFileEl = document.getElementById("vision-file");
const visionPreviewEl = document.getElementById("vision-preview");
const visionOutputEl = document.getElementById("vision-output");
const sendVisionEl = document.getElementById("send-vision");

const imageModelEl = document.getElementById("image-model");
const imagePromptEl = document.getElementById("image-prompt");
const imageSizeEl = document.getElementById("image-size");
const imagePreviewEl = document.getElementById("image-preview");
const imageOutputEl = document.getElementById("image-output");
const sendImageEl = document.getElementById("send-image");

function setBusy(button, busy) {
  button.disabled = busy;
  button.textContent = busy ? "Working..." : button.dataset.label;
}

function initButton(button) {
  button.dataset.label = button.textContent;
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
    throw new Error(
      data.raw?.error?.message ||
      data.error ||
      "Request failed"
    );
  }
  return data;
}

initButton(sendChatEl);
initButton(sendVisionEl);
initButton(sendImageEl);

sendChatEl.addEventListener("click", async () => {
  const message = messageEl.value.trim();
  if (!message) {
    chatOutputEl.textContent = "請先輸入內容";
    return;
  }

  setBusy(sendChatEl, true);
  chatOutputEl.textContent = "thinking...";

  try {
    const data = await postJson("/api/chat", {
      model: chatModelEl.value.trim(),
      message
    });
    chatOutputEl.textContent = data.text || "(empty response)";
  } catch (err) {
    chatOutputEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(sendChatEl, false);
  }
});

visionFileEl.addEventListener("change", async () => {
  const file = visionFileEl.files?.[0];
  if (!file) {
    visionPreviewEl.classList.add("hidden");
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  visionPreviewEl.src = dataUrl;
  visionPreviewEl.classList.remove("hidden");
});

sendVisionEl.addEventListener("click", async () => {
  const message = visionMessageEl.value.trim();
  const file = visionFileEl.files?.[0];
  if (!file) {
    visionOutputEl.textContent = "請先選擇圖片";
    return;
  }

  setBusy(sendVisionEl, true);
  visionOutputEl.textContent = "analyzing...";

  try {
    const imageDataUrl = await readFileAsDataUrl(file);
    const data = await postJson("/api/analyze-image", {
      model: visionModelEl.value.trim(),
      message,
      imageDataUrl
    });
    visionOutputEl.textContent = data.text || "(empty response)";
  } catch (err) {
    visionOutputEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(sendVisionEl, false);
  }
});

sendImageEl.addEventListener("click", async () => {
  const prompt = imagePromptEl.value.trim();
  if (!prompt) {
    imageOutputEl.textContent = "請先輸入圖片描述";
    return;
  }

  setBusy(sendImageEl, true);
  imageOutputEl.textContent = "generating...";
  imagePreviewEl.classList.add("hidden");
  imagePreviewEl.removeAttribute("src");

  try {
    const data = await postJson("/api/generate-image", {
      model: imageModelEl.value.trim(),
      prompt,
      size: imageSizeEl.value.trim()
    });
    if (data.imageUrl) {
      imagePreviewEl.src = data.imageUrl;
      imagePreviewEl.classList.remove("hidden");
      imageOutputEl.textContent = "Done";
    } else {
      imageOutputEl.textContent = data.text || "(empty response)";
    }
  } catch (err) {
    imageOutputEl.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(sendImageEl, false);
  }
});
