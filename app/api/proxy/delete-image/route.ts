import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, imageUrl } = await request.json()

    if (!eventId || !imageUrl) {
      return NextResponse.json({ error: "事件ID和图片URL都是必需的" }, { status: 400 })
    }

    console.log(`代理删除图片请求: 事件ID=${eventId}, 图片URL=${imageUrl}`)

    // 构造API URL
    const apiBaseUrl = "http://43.139.19.144:8000/events-db"
    const requestUrl = `${apiBaseUrl}/${eventId}/imagesByUrl?image_url=${imageUrl}`
    console.log(`发送删除请求到API: ${requestUrl}`)

    const response = await axios.delete(requestUrl, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("代理删除图片响应:", response.data)

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("代理删除图片错误:", error)

    // 提供更详细的错误信息
    if (error.response) {
      console.error("错误响应状态:", error.response.status)
      console.error("错误响应数据:", error.response.data)
      return NextResponse.json(
        {
          error: error.response.data?.detail || error.response.data || "删除图片失败",
          status: error.response.status,
          message: `删除图片失败: ${error.message}`,
        },
        { status: error.response.status || 500 },
      )
    }

    return NextResponse.json(
      {
        error: error.message || "删除图片失败",
        message: "无法连接到API服务器",
      },
      { status: 500 },
    )
  }
}