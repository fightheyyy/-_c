import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request, { params }: { params: { eventId: string } }) {
  const eventId = params.eventId

  if (!eventId) {
    return NextResponse.json({ error: "事件ID不能为空" }, { status: 400 })
  }

  try {
    // 调用外部API获取事件详情
    const response = await axios.get(`http://43.139.19.144:8000/events-db/${eventId}`, {
      timeout: 10000, // 10秒超时
    })

    // 返回事件详情
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(`获取事件 ${eventId} 详情失败:`, error)

    // 提供详细的错误信息
    const errorMessage = error.response?.data?.error || error.message || "未知错误"
    const statusCode = error.response?.status || 500

    return NextResponse.json({ error: `获取事件详情失败: ${errorMessage}` }, { status: statusCode })
  }
}
