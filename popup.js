/**
 * Knowledge Base Chat - Popup Script
 *
 * Handles the chat interface in the extension popup.
 * Sends questions to your AI backend and displays responses.
 */

// API endpoint - swap this for your own backend
const API_ENDPOINT = "https://api.bwengr.com/search";

// Get DOM elements
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");
const loading = document.getElementById("loading");
const contextIndicator = document.getElementById("context-indicator");
const contextText = document.querySelector(".context-text");
const clearContextBtn = document.getElementById("clear-context");

// Store selected context from page
let selectedContext = "";

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadStoredContext();
  setupEventListeners();
  scrollToBottom();
});

function setupEventListeners() {
  chatForm.addEventListener("submit", handleSubmit);

  userInput.addEventListener("input", autoResize);

  clearContextBtn.addEventListener("click", clearContext);

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  });
}

function autoResize() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 100) + "px";
}

async function handleSubmit(e) {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  // Disable input while loading
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  // Add user message to chat
  addMessage("user", question);

  // Show loading
  loading.classList.remove("hidden");
  scrollToBottom();

  try {
    const response = await sendToAI(question);

    if (response.error) {
      addMessage("error", response.error);
    } else {
      addMessage("assistant", response.answer, response.chunks);
    }
  } catch (error) {
    addMessage("error", "Something went wrong. Please try again.");
  }

  // Re-enable input
  sendBtn.disabled = false;
  loading.classList.add("hidden");
  userInput.focus();
}

async function sendToAI(question) {
  const payload = {
    query: question,
    context: selectedContext
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return await response.json();
}

function addMessage(role, content, chunks = []) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  if (role === "assistant") {
    messageDiv.innerHTML = formatContent(content);

    if (chunks && chunks.length > 0) {
      const linksDiv = document.createElement("div");
      linksDiv.className = "links";

      const seen = new Set();
      chunks.forEach((chunk) => {
        if (seen.has(chunk.url)) return;
        seen.add(chunk.url);

        const link = document.createElement("a");
        link.className = "link-pill";
        link.href = chunk.url;
        link.textContent = chunk.title || chunk.url;
        link.title = chunk.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        linksDiv.appendChild(link);
      });

      messageDiv.appendChild(linksDiv);
    }
  } else {
    messageDiv.textContent = content;
  }

  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

function formatContent(text) {
  let html = escapeHtml(text);

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  const paragraphs = html.split(/\n\n+/);
  if (paragraphs.length > 1) {
    return paragraphs.map(p => {
      p = p.replace(/\n/g, "<br>");
      if (p.startsWith("- ") || p.match(/^- /m)) {
        const lines = p.split("<br>");
        const items = lines.filter(l => l.trim().startsWith("-"));
        const first = lines.find(l => !l.trim().startsWith("-") && l.trim());
        let listHtml = "<ul>" + items.map(l => "<li>" + l.replace(/^- /, "") + "</li>").join("") + "</ul>";
        return first ? first + listHtml : listHtml;
      }
      return "<p>" + p + "</p>";
    }).join("");
  }

  if (html.includes("<br>") || html.startsWith("- ")) {
    const lines = html.split("<br>");
    if (lines.some(l => l.trim().startsWith("-"))) {
      const items = lines.filter(l => l.trim().startsWith("-")).map(l => "<li>" + l.replace(/^-\s*/, "") + "</li>").join("");
      return items ? "<ul>" + items + "</ul>" : html;
    }
  }

  return "<p>" + html.replace(/\n/g, "<br>") + "</p>";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  const container = document.getElementById("chat-container");
  container.scrollTop = container.scrollHeight;
}

function loadStoredContext() {
  chrome.storage.local.get(["selectedText"], (result) => {
    if (result.selectedText) {
      selectedContext = result.selectedText;
      contextText.textContent = `"${truncate(result.selectedText, 50)}"`;
      contextIndicator.classList.remove("hidden");
    }
  });
}

function clearContext() {
  selectedContext = "";
  chrome.storage.local.remove(["selectedText"]);
  contextIndicator.classList.add("hidden");
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TEXT_SELECTED") {
    selectedContext = message.text;
    contextText.textContent = `"${truncate(message.text, 50)}"`;
    contextIndicator.classList.remove("hidden");

    // Store for persistence
    chrome.storage.local.set({ selectedText: message.text });

    // Focus the input
    userInput.focus();
  }
});