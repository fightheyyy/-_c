import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageId } = await request.json()

    if (!eventId || !messageId) {
      return NextResponse.json({ error: "事件ID和消息ID是必需的" }, { status: 400 })
    }

    // Simplify message ID extraction
    let cleanMessageId = messageId
    if (/\.(jpg|jpeg|png|gif)$/i.test(messageId)) {
      const msgIdMatch = messageId.match(/om_[a-zA-Z0-9_-]+/)
      cleanMessageId = msgIdMatch ? msgIdMatch[0] : messageId.replace(/\.[^/.]+$/, "")
    }

    const response = await axios.delete(`http://43.139.19.144:8000/events-db/${eventId}/images/${cleanMessageId}`, {
      timeout: 8000, // Reduce timeout to avoid deployment timeouts
      headers: { "Content-Type": "application/json" },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    // Simplified error handling
    const status = error.response?.status || 500
    const errorMessage = error.response?.data?.detail || error.message || "删除图片失败"

    return NextResponse.json({ error: errorMessage }, { status })
  }
}
