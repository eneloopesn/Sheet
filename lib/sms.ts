// SMS 通知服務
// 這裡使用範例 API，實際使用時需要替換為真實的 SMS Gateway (如 Twilio, Nexmo 等)

interface SMSOptions {
  to: string
  message: string
}

export async function sendSMS({ to, message }: SMSOptions): Promise<boolean> {
  try {
    // 範例：使用環境變數中的 SMS API 設定
    const apiKey = process.env.SMS_API_KEY
    const apiSecret = process.env.SMS_API_SECRET
    const fromNumber = process.env.SMS_FROM_NUMBER

    if (!apiKey || !apiSecret) {
      console.warn('SMS credentials not configured, skipping SMS send')
      return false
    }

    // 實際實作時，這裡應該調用真實的 SMS API
    // 範例：Twilio API call
    // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${apiKey}/Messages.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     From: fromNumber,
    //     To: to,
    //     Body: message,
    //   }),
    // })

    // 目前先記錄到 console，實際部署時再連接真實 SMS 服務
    console.log(`[SMS] To: ${to}, Message: ${message}`)
    
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}

export function formatLeaveSMS(memberName: string, classDate: string, className: string): string {
  return `【瑜珈教室】${memberName} 您好，您的請假申請已成功：${className}（${classDate}）。如有疑問請聯繫我們。`
}

export function formatMakeupSMS(memberName: string, classDate: string, className: string): string {
  return `【瑜珈教室】${memberName} 您好，您的補課申請已成功：${className}（${classDate}）。請準時出席，如有疑問請聯繫我們。`
}


