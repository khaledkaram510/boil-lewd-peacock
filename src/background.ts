// background.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log("Text Highlighter extension installed")
})

// Handle messages between content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_HIGHLIGHTS") {
    // This can be used for future cross-tab communication
    sendResponse({ success: true })
  }
})

export {}
