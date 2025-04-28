import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request) {
  // 从URL获取eventId参数
  const url = new URL(request.url)
  const eventId = url.searchParams.get("eventId")

  if (!eventId) {
    return NextResponse.json({ error: "事件ID是必需的" }, { status: 400 })
  }

  try {
    console.log(`获取消息请求: 事件ID=${eventId}`)

    // 调用外部API
    const response = await axios.get(`http://43.139.19.144:8000/events-db/${eventId}/messages`, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("获取消息响应:", response.data)

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("获取消息失败:", error)

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
        error: error.response?.data?.error || "获取消息失败，请稍后再试",
      },
      { status: error.response?.status || 500 },
    )
  }
}
