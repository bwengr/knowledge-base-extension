/**
 * Knowledge Base Chat - Background Service Worker
 *
 * Handles extension lifecycle events and keyboard shortcuts.
 */

// Default keyboard shortcut: Ctrl+Shift+K (or Cmd+Shift+K on Mac)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-knowledge-base",
    title: "Ask Knowledge Base",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ask-knowledge-base" && info.selectionText) {
    // Send selected text to popup
    chrome.runtime.sendMessage({
      type: "TEXT_SELECTED",
      text: info.selectionText
    });

    // Open the extension popup
    chrome.action.openPopup();
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TEXT_SELECTED") {
    // Store the selected text
    chrome.storage.local.set({ selectedText: message.text });
  }
});