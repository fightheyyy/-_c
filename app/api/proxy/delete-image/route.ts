import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageId, imageKey } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "事件ID是必需的" }, { status: 400 })
    }

    // 必须提供messageId或imageKey中的一个
    if (!messageId && !imageKey) {
      return NextResponse.json({ error: "消息ID或图片键是必需的" }, { status: 400 })
    }

    // 优先使用messageId，如果提供了的话
    const idToUse = messageId || imageKey

    console.log(
      `代理删除图片请求: 事件ID=${eventId}, 使用ID=${idToUse}, 原始messageId=${messageId}, 原始imageKey=${imageKey}`,
    )

    // 记录完整的请求URL以便调试
    const requestUrl = `http://43.139.19.144:8000/events-db/${eventId}/images/${idToUse}`
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
