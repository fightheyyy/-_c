import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request, { params }: { params: { eventId: string } }) {
  const eventId = params.eventId

  try {
    const body = await request.json()
    const { image_key, sender_id, timestamp, image_data, message_id } = body

    // 验证必要的字段
    if (!image_key || !message_id) {
      return NextResponse.json({ error: "缺少必要的图片信息" }, { status: 400 })
    }

    const response = await axios.post(`http://43.139.19.144:8000/events-db/${eventId}/images`, {
      image_key,
      sender_id,
      timestamp,
      image_data,
      message_id,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(`Error adding image to event ${eventId}:`, error)

    // 处理特定的错误状态码
    if (error.response?.status === 404) {
      return NextResponse.json({ error: "未找到指定的事件卡片" }, { status: 404 })
    }

    return NextResponse.json({ error: "添加图片失败" }, { status: 500 })
  }
}
