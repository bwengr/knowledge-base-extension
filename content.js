/**
 * Knowledge Base Chat - Content Script
 *
 * Runs on any page to capture selected text and send it to the extension.
 * Allows users to highlight text on a page and use it as context for their question.
 */

// Listen for text selection
document.addEventListener("mouseup", handleTextSelection);
document.addEventListener("keyup", (e) => {
  if (e.shiftKey && e.key === "ArrowUp") {
    handleTextSelection();
  }
});

function handleTextSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 10 && selectedText.length < 5000) {
    // Send to extension
    chrome.runtime.sendMessage({
      type: "TEXT_SELECTED",
      text: selectedText
    });

    // Visual feedback that text was captured
    showNotification(selectedText);
  }
}

function showNotification(text) {
  // Remove existing notification if any
  const existing = document.getElementById("kb-chat-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.id = "kb-chat-notification";
  notification.textContent = "Added to chat context";
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1a1a1a;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: -apple-system, sans-serif;
    font-size: 13px;
    z-index: 999999;
    animation: kb-fade-in 0.2s ease-out;
  `;

  // Add animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes kb-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove after 2 seconds
  setTimeout(() => {
    notification.style.animation = "kb-fade-out 0.2s ease-out";
    setTimeout(() => notification.remove(), 200);
  }, 2000);
}