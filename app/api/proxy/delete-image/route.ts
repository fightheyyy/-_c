import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageId } = await request.json()

    if (!eventId || !messageId) {
      return NextResponse.json({ error: "事件ID和消息ID是必需的" }, { status: 400 })
    }

    // Extract clean message ID
    let cleanMessageId = messageId
    if (/\.(jpg|jpeg|png|gif)$/i.test(messageId)) {
      const msgIdMatch = messageId.match(/om_[a-zA-Z0-9_-]+/)
      cleanMessageId = msgIdMatch ? msgIdMatch[0] : messageId.replace(/\.[^/.]+$/, "")
    }

    // Call the API with reduced timeout
    const response = await axios.delete(`http://43.139.19.144:8000/events-db/${eventId}/images/${cleanMessageId}`, {
      timeout: 5000,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.detail || "删除图片失败" },
      { status: error.response?.status || 500 },
    )
  }
}
