import { NextResponse } from "next/server"
import axios from "axios"

export async function DELETE(request: Request, { params }: { params: { eventId: string; messageId: string } }) {
  const { eventId, messageId } = params

  try {
    const response = await axios.delete(`http://43.139.19.144:8000/events-db/${eventId}/images/${messageId}`)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(`Error deleting image from event ${eventId}:`, error)

    // 处理特定的错误状态码
    if (error.response?.status === 404) {
      return NextResponse.json({ error: "未找到指定的事件卡片或图片" }, { status: 404 })
    }

    return NextResponse.json({ error: "删除图片失败" }, { status: 500 })
  }
}
