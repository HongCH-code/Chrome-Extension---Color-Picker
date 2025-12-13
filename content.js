// 防止重複注入
if (window.colorPickerInjected) {
  console.log('Color Picker already injected');
} else {
  window.colorPickerInjected = true;

  // 監聽來自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startPicking') {
      // 清理任何現有的取色器
      cleanupExistingPicker();

      // 檢查是否支援 EyeDropper API
      if (window.EyeDropper) {
        startEyeDropper();
      } else {
        startColorPicking();
      }

      sendResponse({ success: true });
      return true;
    }
  });
}

// 使用 EyeDropper API（更準確，推薦）
async function startEyeDropper() {
  try {
    const eyeDropper = new EyeDropper();
    console.log('Using EyeDropper API');

    const result = await eyeDropper.open();

    if (result && result.sRGBHex) {
      console.log('Color picked:', result.sRGBHex);

      // 發送選中的顏色
      chrome.runtime.sendMessage({
        action: 'colorPicked',
        color: result.sRGBHex
      });
    }
  } catch (err) {
    console.log('EyeDropper cancelled or failed:', err);
  }
}

// 清理現有的取色器元素
function cleanupExistingPicker() {
  const existingOverlay = document.getElementById('color-picker-overlay');
  const existingMagnifier = document.getElementById('color-picker-magnifier');
  const existingInfo = document.getElementById('color-picker-info');

  if (existingOverlay) existingOverlay.remove();
  if (existingMagnifier) existingMagnifier.remove();
  if (existingInfo) existingInfo.remove();
}

// 開始取色
function startColorPicking() {
  // 創建覆蓋層
  const overlay = document.createElement('div');
  overlay.id = 'color-picker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    cursor: crosshair;
    background: transparent;
  `;

  // 創建放大鏡容器
  const magnifier = document.createElement('div');
  magnifier.id = 'color-picker-magnifier';
  magnifier.style.cssText = `
    position: fixed;
    width: 150px;
    height: 150px;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 2147483648;
    display: none;
    overflow: hidden;
    background: #fff;
  `;

  // 創建放大鏡畫布
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 150;
  canvas.style.cssText = `
    width: 100%;
    height: 100%;
  `;
  magnifier.appendChild(canvas);

  // 創建顏色資訊顯示
  const colorInfo = document.createElement('div');
  colorInfo.id = 'color-picker-info';
  colorInfo.style.cssText = `
    position: fixed;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    border-radius: 6px;
    font-family: monospace;
    font-size: 14px;
    pointer-events: none;
    z-index: 2147483648;
    display: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(magnifier);
  document.body.appendChild(colorInfo);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let selectedColor = null;

  // 鼠標移動事件
  const onMouseMove = (e) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;

    // 顯示放大鏡和顏色資訊
    magnifier.style.display = 'block';
    colorInfo.style.display = 'block';
    magnifier.style.visibility = 'visible';
    colorInfo.style.visibility = 'visible';

    // 更新位置（確保在視窗內）
    const offsetX = (x + 170 > window.innerWidth) ? -170 : 20;
    const offsetY = (y + 170 > window.innerHeight) ? -170 : 20;

    magnifier.style.left = `${x + offsetX}px`;
    magnifier.style.top = `${y + offsetY}px`;
    colorInfo.style.left = `${x + 20}px`;
    colorInfo.style.top = `${y + offsetY + 160}px`;

    // 獲取顏色
    const color = getColorAtPosition(x, y);
    if (color) {
      colorInfo.textContent = color;
      colorInfo.style.backgroundColor = color;

      // 繪製放大區域
      drawMagnifiedArea(ctx, x, y, color);
    }
  };

  // 鼠標點擊事件
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;
    selectedColor = getColorAtPosition(x, y);

    cleanup();

    // 發送選中的顏色到 popup
    if (selectedColor) {
      chrome.runtime.sendMessage({
        action: 'colorPicked',
        color: selectedColor
      });
      console.log('Color picked:', selectedColor);
    }
  };

  // ESC 鍵取消
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      console.log('Color picking cancelled');
    }
  };

  // 清理
  const cleanup = () => {
    overlay.removeEventListener('mousemove', onMouseMove);
    overlay.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    magnifier.remove();
    colorInfo.remove();
  };

  // 添加事件監聽到 overlay
  overlay.addEventListener('mousemove', onMouseMove);
  overlay.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown);

  console.log('Color picker started, overlay added to body');
}

// 獲取指定位置的顏色
function getColorAtPosition(x, y) {
  // 臨時隱藏覆蓋層和放大鏡
  const overlay = document.getElementById('color-picker-overlay');
  const magnifier = document.getElementById('color-picker-magnifier');
  const colorInfo = document.getElementById('color-picker-info');

  if (overlay) overlay.style.display = 'none';
  if (magnifier) magnifier.style.display = 'none';
  if (colorInfo) colorInfo.style.display = 'none';

  // 獲取元素
  const element = document.elementFromPoint(x, y);

  // 恢復覆蓋層和放大鏡
  if (overlay) overlay.style.display = 'block';
  if (magnifier) magnifier.style.display = 'block';
  if (colorInfo) colorInfo.style.display = 'block';

  if (!element) return null;

  // 獲取計算後的樣式
  const styles = window.getComputedStyle(element);
  let color = styles.backgroundColor;

  // 如果背景透明，往上查找
  if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
    let parent = element.parentElement;
    while (parent && (color === 'rgba(0, 0, 0, 0)' || color === 'transparent')) {
      const parentStyles = window.getComputedStyle(parent);
      color = parentStyles.backgroundColor;
      parent = parent.parentElement;
    }
  }

  // 如果還是透明，使用白色
  if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
    color = 'rgb(255, 255, 255)';
  }

  return rgbToHex(color);
}

// RGB 轉 HEX
function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#FFFFFF';

  const r = parseInt(result[0]);
  const g = parseInt(result[1]);
  const b = parseInt(result[2]);

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// 繪製放大區域
function drawMagnifiedArea(ctx, x, y, color) {
  // 清空畫布
  ctx.clearRect(0, 0, 150, 150);

  // 填充整個圓形區域為當前顏色
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 150, 150);

  // 繪製十字準線
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 2;

  // 垂直線
  ctx.beginPath();
  ctx.moveTo(75, 0);
  ctx.lineTo(75, 150);
  ctx.stroke();

  // 水平線
  ctx.beginPath();
  ctx.moveTo(0, 75);
  ctx.lineTo(150, 75);
  ctx.stroke();

  // 繪製中心圓點
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(75, 75, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(75, 75, 4, 0, Math.PI * 2);
  ctx.stroke();
}
