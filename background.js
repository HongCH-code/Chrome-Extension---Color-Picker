// Background Service Worker
// 用於處理 content script 和 popup 之間的消息傳遞

// 監聽來自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'colorPicked' && request.color) {
    console.log('Background received color:', request.color);

    // 保存到 storage
    chrome.storage.local.set({
      lastPickedColor: request.color,
      timestamp: Date.now()
    }, () => {
      console.log('Color saved to storage:', request.color);
      sendResponse({ success: true });
    });

    return true; // 保持消息通道開啟
  }
});

// 監聽 storage 變化（可選，用於調試）
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.lastPickedColor) {
    console.log('Color updated:', changes.lastPickedColor.newValue);
  }
});
