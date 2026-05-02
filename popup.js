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
      addMessage("assistant", response.answer, response.sources);
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

function addMessage(role, content, sources = []) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  if (role === "assistant") {
    const contentP = document.createElement("p");
    contentP.textContent = content;
    messageDiv.appendChild(contentP);

    if (sources && sources.length > 0) {
      const sourcesDiv = document.createElement("div");
      sourcesDiv.className = "sources";

      const sourcesTitle = document.createElement("div");
      sourcesTitle.className = "sources-title";
      sourcesTitle.textContent = "Sources";
      sourcesDiv.appendChild(sourcesTitle);

      sources.forEach((source) => {
        const link = document.createElement("a");
        link.className = "source-link";
        link.href = source;
        link.textContent = source;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        sourcesDiv.appendChild(link);
      });

      messageDiv.appendChild(sourcesDiv);
    }
  } else {
    messageDiv.textContent = content;
  }

  chatMessages.appendChild(messageDiv);
  scrollToBottom();
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