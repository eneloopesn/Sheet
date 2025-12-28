import QRCode from 'qrcode'
import { createCanvas, loadImage, registerFont } from 'canvas'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * 註冊 Windows 系統的中文字體
 */
function registerChineseFont() {
  // Windows 系統字體路徑
  const fontPaths = [
    'C:/Windows/Fonts/msjh.ttc',           // 微軟正黑體
    'C:/Windows/Fonts/msjhbd.ttc',        // 微軟正黑體 Bold
    'C:/Windows/Fonts/msyh.ttc',           // 微軟雅黑
    'C:/Windows/Fonts/msyhbd.ttc',        // 微軟雅黑 Bold
    'C:/Windows/Fonts/mingliu.ttc',       // 新細明體
    'C:/Windows/Fonts/kaiu.ttf',          // 標楷體
  ]

  // 嘗試註冊第一個可用的字體
  for (const fontPath of fontPaths) {
    if (existsSync(fontPath)) {
      try {
        registerFont(fontPath, { family: 'ChineseFont' })
        return 'ChineseFont'
      } catch (e) {
        // 繼續嘗試下一個字體
        continue
      }
    }
  }

  return null
}

/**
 * 生成帶有會員姓名的 QR code 圖片
 * @param account 會員帳號（QR code 內容）
 * @param name 會員姓名（顯示在 QR code 下方）
 * @returns Base64 編碼的圖片數據
 */
export async function generateQRCodeWithName(
  account: string,
  name: string
): Promise<string> {
  // 註冊中文字體
  const chineseFontName = registerChineseFont()

  // 生成 QR code 數據 URL
  const qrCodeDataUrl = await QRCode.toDataURL(account, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })

  // 載入 QR code 圖片
  const qrImage = await loadImage(qrCodeDataUrl)

  // 創建 canvas，預留空間顯示姓名
  const padding = 20
  const textHeight = 40
  const canvas = createCanvas(qrImage.width, qrImage.height + textHeight + padding * 2)
  const ctx = canvas.getContext('2d')

  // 設置背景為白色
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 繪製 QR code
  ctx.drawImage(qrImage, 0, padding)

  // 繪製會員姓名（使用支援中文的字體）
  ctx.fillStyle = '#000000'
  if (chineseFontName) {
    ctx.font = `bold 24px ${chineseFontName}`
  } else {
    // 如果無法註冊字體，嘗試使用系統字體名稱
    ctx.font = 'bold 24px "Microsoft JhengHei", "Microsoft YaHei", "PMingLiU", "DFKai-SB", sans-serif'
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, canvas.width / 2, qrImage.height + padding + textHeight / 2)

  // 轉換為 Base64
  return canvas.toDataURL('image/png')
}

/**
 * 將 Base64 圖片轉換為 Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

