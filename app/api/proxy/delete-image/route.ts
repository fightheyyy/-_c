import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageId } = await request.json()

    if (!eventId || !messageId) {
      return NextResponse.json({ error: "事件ID和消息ID是必需的" }, { status: 400 })
    }

    console.log(`代理删除图片请求: 事件ID=${eventId}, 消息ID=${messageId}`)

    const response = await axios.delete(`http://43.139.19.144:8000/events-db/${eventId}/images/${messageId}`, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("代理删除图片响应:", response.data)

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("代理删除图片错误:", error)

    if (error.response) {
      return NextResponse.json(
        { error: error.response.data || "删除图片失败" },
        { status: error.response.status || 500 },
      )
    }

    return NextResponse.json({ error: error.message || "删除图片失败" }, { status: 500 })
  }
}
