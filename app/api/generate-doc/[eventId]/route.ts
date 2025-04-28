import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request, { params }: { params: { eventId: string } }) {
  const eventId = params.eventId

  if (!eventId) {
    return NextResponse.json({ error: "事件ID不能为空" }, { status: 400 })
  }

  try {
    console.log(`尝试为事件 ${eventId} 生成文档`)

    // 调用外部API生成文档
    const response = await axios.get(`http://43.139.19.144:8000/generate_doc/${eventId}`, {
      timeout: 30000, // 30秒超时，文档生成可能需要一些时间
    })

    // 返回API响应
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(`为事件 ${eventId} 生成文档失败:`, error)

    // 提供详细的错误信息
    const errorMessage = error.response?.data?.error || error.message || "未知错误"
    const statusCode = error.response?.status || 500

    return NextResponse.json({ error: `生成文档失败: ${errorMessage}` }, { status: statusCode })
  }
}
