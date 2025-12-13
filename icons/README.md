# 圖標說明

這個資料夾包含擴充套件的圖標文件。

## 生成 PNG 圖標

由於我提供的是 SVG 格式，你需要將 `icon.svg` 轉換為以下尺寸的 PNG 文件：

- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

### 方法 1: 使用線上工具

訪問 [CloudConvert](https://cloudconvert.com/svg-to-png) 或類似的 SVG 轉 PNG 工具：
1. 上傳 `icon.svg`
2. 設定輸出尺寸（16x16, 48x48, 128x128）
3. 下載轉換後的 PNG 文件
4. 重命名為對應的檔名

### 方法 2: 使用命令行工具

如果你安裝了 ImageMagick 或 Inkscape：

```bash
# 使用 ImageMagick
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png

# 或使用 Inkscape
inkscape icon.svg -w 16 -h 16 -o icon16.png
inkscape icon.svg -w 48 -h 48 -o icon48.png
inkscape icon.svg -w 128 -h 128 -o icon128.png
```

### 方法 3: 臨時使用 emoji

在開發階段，你也可以暫時使用簡單的 PNG 圖標或 emoji 截圖。
