// Background Service Worker
// 用於處理 content script 和 popup 之間的消息傳遞

const MAX_HISTORY_ITEMS = 20;

// 添加顏色到歷史記錄
function addColorToHistory(hexColor) {
  // 標準化 HEX（大寫，帶 #）
  let normalizedHex = hexColor.toUpperCase();
  if (!normalizedHex.startsWith('#')) {
    normalizedHex = '#' + normalizedHex;
  }

  chrome.storage.local.get(['colorHistory'], (result) => {
    let history = result.colorHistory || [];

    // 移除重複（不區分大小寫）
    history = history.filter(item =>
      item.hex.toUpperCase() !== normalizedHex
    );

    // 添加到最前面（最新）
    history.unshift({
      hex: normalizedHex,
      timestamp: Date.now()
    });

    // 限制為 20 條
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    // 保存到 storage
    chrome.storage.local.set({ colorHistory: history }, () => {
      console.log('Color added to history:', normalizedHex, 'Total:', history.length);
    });
  });
}

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

      // 添加到歷史記錄
      addColorToHistory(request.color);

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
  if (namespace === 'local' && changes.colorHistory) {
    console.log('History updated, count:', changes.colorHistory.newValue?.length || 0);
  }
});
