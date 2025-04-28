import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageId } = await request.json()

    if (!eventId || !messageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Simplified message ID extraction
    let cleanMessageId = messageId
    if (messageId.includes(".")) {
      cleanMessageId = messageId.split(".")[0]
    }

    await axios.delete(`http://43.139.19.144:8000/events-db/${eventId}/images/${cleanMessageId}`, {
      timeout: 3000,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
