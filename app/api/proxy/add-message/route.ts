import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageData } = await request.json()

    if (!eventId || !messageData) {
      return NextResponse.json({ error: "事件ID和消息数据是必需的" }, { status: 400 })
    }

    console.log(`添加消息请求: 事件ID=${eventId}`, messageData)

    // 调用外部API
    const response = await axios.post(`http://43.139.19.144:8000/events-db/${eventId}/messages`, messageData, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("添加消息响应:", response.data)

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("添加消息失败:", error)

    // 详细记录错误信息
    if (error.response) {
      console.error("错误响应数据:", error.response.data)
      console.error("错误响应状态:", error.response.status)
    } else if (error.request) {
      console.error("请求已发出但无响应:", error.request)
    } else {
      console.error("请求错误:", error.message)
    }

    return NextResponse.json(
      {
        error: error.response?.data?.error || "添加消息失败，请稍后再试",
      },
      { status: error.response?.status || 500 },
    )
  }
}
