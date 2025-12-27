// 全局變量
let currentColor = {
  h: 217,
  s: 70,
  l: 50
};

// DOM 元素
const hueSlider = document.getElementById('hueSlider');
const slPicker = document.getElementById('slPicker');
const slIndicator = document.getElementById('slIndicator');
const currentColorDisplay = document.getElementById('currentColorDisplay');
const currentColorText = document.getElementById('currentColorText');
const hexValue = document.getElementById('hexValue');
const rgbR = document.getElementById('rgbR');
const rgbG = document.getElementById('rgbG');
const rgbB = document.getElementById('rgbB');
const hslValue = document.getElementById('hslValue');
const pickColorBtn = document.getElementById('pickColorBtn');
const monochromaticBtn = document.getElementById('monochromaticBtn');
const complementaryBtn = document.getElementById('complementaryBtn');
const paletteDisplay = document.getElementById('paletteDisplay');
const copyBtns = document.querySelectorAll('.copy-btn');
const historyDisplay = document.getElementById('historyDisplay');
const historyCount = document.getElementById('historyCount');
const MAX_HISTORY_ITEMS = 20;

// HSL 轉 RGB
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// RGB 轉 HEX
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// RGB 轉 HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// HEX 轉 RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 更新顏色顯示
function updateColorDisplay() {
  const rgb = hslToRgb(currentColor.h, currentColor.s, currentColor.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  // 更新顏色預覽
  currentColorDisplay.style.backgroundColor = hex;
  currentColorText.textContent = hex;

  // 更新 HEX 值
  hexValue.textContent = hex;

  // 更新 RGB 值
  rgbR.value = rgb.r;
  rgbG.value = rgb.g;
  rgbB.value = rgb.b;

  // 更新 HSL 值
  hslValue.textContent = `${currentColor.h}°, ${currentColor.s}%, ${currentColor.l}%`;

  // 更新飽和度/亮度選擇器背景
  updateSLPickerBackground();
}

// 更新飽和度/亮度選擇器背景
function updateSLPickerBackground() {
  const baseColor = hslToRgb(currentColor.h, 100, 50);
  const baseHex = rgbToHex(baseColor.r, baseColor.g, baseColor.b);
  slPicker.style.background = `
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, ${baseHex})
  `;
}

// 色相滑桿變化
hueSlider.addEventListener('input', (e) => {
  currentColor.h = parseInt(e.target.value);
  updateColorDisplay();
});

// 飽和度/亮度選擇器點擊
slPicker.addEventListener('mousedown', (e) => {
  const updateSL = (event) => {
    const rect = slPicker.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));

    currentColor.s = Math.round((x / rect.width) * 100);
    currentColor.l = Math.round((1 - y / rect.height) * 100);

    // 更新指示器位置
    slIndicator.style.left = `${x}px`;
    slIndicator.style.top = `${y}px`;

    updateColorDisplay();
  };

  updateSL(e);

  const onMouseMove = (event) => updateSL(event);
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

// RGB 輸入框變化
[rgbR, rgbG, rgbB].forEach(input => {
  input.addEventListener('input', () => {
    const r = parseInt(rgbR.value) || 0;
    const g = parseInt(rgbG.value) || 0;
    const b = parseInt(rgbB.value) || 0;

    const hsl = rgbToHsl(r, g, b);
    currentColor = hsl;

    hueSlider.value = hsl.h;
    updateColorDisplay();
    updateSLIndicatorPosition();
  });
});

// 更新飽和度/亮度指示器位置
function updateSLIndicatorPosition() {
  const rect = slPicker.getBoundingClientRect();
  const x = (currentColor.s / 100) * rect.width;
  const y = (1 - currentColor.l / 100) * rect.height;
  slIndicator.style.left = `${x}px`;
  slIndicator.style.top = `${y}px`;
}

// 複製功能
copyBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    const type = btn.dataset.copy;
    let textToCopy = '';

    switch (type) {
      case 'hex':
        textToCopy = hexValue.textContent;
        break;
      case 'rgb':
        textToCopy = `rgb(${rgbR.value}, ${rgbG.value}, ${rgbB.value})`;
        break;
      case 'hsl':
        textToCopy = `hsl(${currentColor.h}, ${currentColor.s}%, ${currentColor.l}%)`;
        break;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);

      // 視覺反饋
      btn.classList.add('copied');
      setTimeout(() => {
        btn.classList.remove('copied');
      }, 1000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  });
});

// 網頁取色功能
pickColorBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 確保 content script 已載入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (err) {
      // content.js 可能已經載入（透過 manifest），忽略錯誤
      console.log('Content script may already be loaded');
    }

    // 等待一下確保腳本已執行
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'startPicking' });
      // 關閉 popup，讓用戶可以在網頁上選擇顏色
      window.close();
    }, 100);
  } catch (err) {
    console.error('取色失敗:', err);
    alert('取色功能啟動失敗。請確保不是在 Chrome 內建頁面上使用。');
  }
});

// 監聽從 content script 傳來的顏色
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'colorPicked' && request.color) {
    const rgb = hexToRgb(request.color);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      currentColor = hsl;
      hueSlider.value = hsl.h;
      updateColorDisplay();
      updateSLIndicatorPosition();

      // 保存到 storage
      chrome.storage.local.set({ lastPickedColor: request.color });

      // 添加到歷史記錄
      addColorToHistory(request.color);
    }
  }
});

// 啟動時載入上次選擇的顏色
chrome.storage.local.get(['lastPickedColor'], (result) => {
  if (result.lastPickedColor) {
    const rgb = hexToRgb(result.lastPickedColor);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      currentColor = hsl;
      hueSlider.value = hsl.h;
      updateColorDisplay();
      updateSLIndicatorPosition();
    }
  }
});

// 歷史記錄功能

// 載入並渲染歷史記錄
function loadColorHistory() {
  chrome.storage.local.get(['colorHistory', 'lastPickedColor'], (result) => {
    let history = result.colorHistory || [];

    // 遷移：如果歷史為空但有 lastPickedColor，則初始化歷史
    if (history.length === 0 && result.lastPickedColor) {
      history = [{ hex: result.lastPickedColor, timestamp: Date.now() }];
      chrome.storage.local.set({ colorHistory: history });
    }

    renderHistory(history);
  });
}

// 渲染歷史記錄到 DOM
function renderHistory(history) {
  historyDisplay.innerHTML = '';

  // 更新計數
  historyCount.textContent = `(${history.length})`;

  // 顯示空狀態
  if (history.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'history-empty';
    emptyState.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <p>No color history yet</p>
      <span>Pick colors to start building your history</span>
    `;
    historyDisplay.appendChild(emptyState);
    return;
  }

  // 渲染每個歷史項目
  history.forEach((colorItem) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.color = colorItem.hex;

    const preview = document.createElement('div');
    preview.className = 'history-color-preview';
    preview.style.backgroundColor = colorItem.hex;

    const value = document.createElement('span');
    value.className = 'history-color-value';
    value.textContent = colorItem.hex;

    item.appendChild(preview);
    item.appendChild(value);

    // 點擊處理：載入顏色到選擇器
    item.addEventListener('click', () => {
      loadColorFromHistory(colorItem.hex);
    });

    historyDisplay.appendChild(item);
  });
}

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
      renderHistory(history);
    });
  });
}

// 從歷史記錄載入顏色
function loadColorFromHistory(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (rgb) {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    currentColor = hsl;
    hueSlider.value = hsl.h;
    updateColorDisplay();
    updateSLIndicatorPosition();

    // 視覺反饋
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
      if (item.dataset.color === hexColor) {
        item.style.transform = 'scale(1.1)';
        setTimeout(() => {
          item.style.transform = '';
        }, 200);
      }
    });
  }
}

// 生成單色調色板
function generateMonochromaticPalette() {
  const colors = [];
  const baseL = currentColor.l;

  for (let i = -2; i <= 2; i++) {
    const l = Math.max(10, Math.min(90, baseL + i * 15));
    const rgb = hslToRgb(currentColor.h, currentColor.s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    colors.push(hex);
  }

  return colors;
}

// 生成互補色調色板
function generateComplementaryPalette() {
  const colors = [];
  const rgb = hslToRgb(currentColor.h, currentColor.s, currentColor.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  colors.push(hex);

  // 互補色（對面180度）
  const compH = (currentColor.h + 180) % 360;
  const compRgb = hslToRgb(compH, currentColor.s, currentColor.l);
  const compHex = rgbToHex(compRgb.r, compRgb.g, compRgb.b);
  colors.push(compHex);

  // 分裂互補色
  const split1H = (currentColor.h + 150) % 360;
  const split1Rgb = hslToRgb(split1H, currentColor.s, currentColor.l);
  const split1Hex = rgbToHex(split1Rgb.r, split1Rgb.g, split1Rgb.b);
  colors.push(split1Hex);

  const split2H = (currentColor.h + 210) % 360;
  const split2Rgb = hslToRgb(split2H, currentColor.s, currentColor.l);
  const split2Hex = rgbToHex(split2Rgb.r, split2Rgb.g, split2Rgb.b);
  colors.push(split2Hex);

  // 三色組
  const triad1H = (currentColor.h + 120) % 360;
  const triad1Rgb = hslToRgb(triad1H, currentColor.s, currentColor.l);
  const triad1Hex = rgbToHex(triad1Rgb.r, triad1Rgb.g, triad1Rgb.b);
  colors.push(triad1Hex);

  return colors;
}

// 顯示調色板
function displayPalette(colors) {
  paletteDisplay.innerHTML = '';
  colors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'palette-color';
    colorDiv.style.backgroundColor = color;

    const colorText = document.createElement('span');
    colorText.textContent = color;
    colorDiv.appendChild(colorText);

    colorDiv.addEventListener('click', async () => {
      await navigator.clipboard.writeText(color);

      // 添加到歷史記錄
      addColorToHistory(color);

      colorDiv.style.transform = 'scale(1.1)';
      setTimeout(() => {
        colorDiv.style.transform = 'scale(1)';
      }, 200);
    });

    paletteDisplay.appendChild(colorDiv);
  });
}

// 單色調色板按鈕
monochromaticBtn.addEventListener('click', () => {
  monochromaticBtn.classList.add('active');
  complementaryBtn.classList.remove('active');
  const colors = generateMonochromaticPalette();
  displayPalette(colors);
});

// 互補色調色板按鈕
complementaryBtn.addEventListener('click', () => {
  complementaryBtn.classList.add('active');
  monochromaticBtn.classList.remove('active');
  const colors = generateComplementaryPalette();
  displayPalette(colors);
});

// 初始化
function init() {
  updateColorDisplay();
  updateSLIndicatorPosition();

  // 載入歷史記錄
  loadColorHistory();

  // 預設顯示當前顏色
  const rgb = hslToRgb(currentColor.h, currentColor.s, currentColor.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  displayPalette([hex]);
}

// 監聽 storage 變化以同步多個 popup 實例
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.colorHistory) {
    renderHistory(changes.colorHistory.newValue || []);
  }
});

init();
