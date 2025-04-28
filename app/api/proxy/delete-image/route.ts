import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const { eventId, messageId } = await request.json()

    if (!eventId || !messageId) {
      return NextResponse.json({ error: "事件ID和消息ID是必需的" }, { status: 400 })
    }

    console.log(`代理删除图片请求: 事件ID=${eventId}, 消息ID=${messageId}`)

    // 检查messageId是否包含文件扩展名，如果有则尝试提取纯消息ID
    let cleanMessageId = messageId
    if (/\.(jpg|jpeg|png|gif)$/i.test(messageId)) {
      // 尝试从文件名中提取message_id格式的部分
      const msgIdMatch = messageId.match(/om_[a-zA-Z0-9_-]+/)
      if (msgIdMatch) {
        cleanMessageId = msgIdMatch[0]
        console.log(`从文件名中提取到纯消息ID: ${cleanMessageId}`)
      } else {
        // 如果没有找到message_id格式，去除扩展名
        cleanMessageId = messageId.replace(/\.[^/.]+$/, "")
        console.log(`去除扩展名后的消息ID: ${cleanMessageId}`)
      }
    }

    console.log(`发送删除请求到API: 事件ID=${eventId}, 消息ID=${cleanMessageId}`)

    const response = await axios.delete(`http://43.139.19.144:8000/events-db/${eventId}/images/${cleanMessageId}`, {
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
