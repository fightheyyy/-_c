import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request, { params }: { params: { messageId: string } }) {
  const messageId = params.messageId

  if (!messageId) {
    return NextResponse.json({ error: "消息ID不能为空" }, { status: 400 })
  }

  try {
    // 调用外部API获取消息详情
    const response = await axios.get(`http://43.139.19.144:8000/get_Message/${messageId}`, {
      timeout: 10000, // 10秒超时
    })

    // 返回消息详情
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(`获取消息 ${messageId} 详情失败:`, error)

    // 提供详细的错误信息
    const errorMessage = error.response?.data?.error || error.message || "未知错误"
    const statusCode = error.response?.status || 500

    return NextResponse.json({ error: `获取消息详情失败: ${errorMessage}` }, { status: statusCode })
  }
}
