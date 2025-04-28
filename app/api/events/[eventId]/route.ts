import { NextResponse } from "next/server"
import axios from "axios"

// 修改GET方法来处理删除操作，使用正确的API路径
export async function GET(request: Request, { params }: { params: { eventId: string } }) {
  // 确保 params 是已解析的
  const { eventId } = params

  if (!eventId) {
    return NextResponse.json({ error: "事件ID不能为空" }, { status: 400 })
  }

  try {
    console.log(`尝试通过GET请求删除事件，ID: ${eventId}`)

    // 修改API路径，直接使用events-db/{eventId}，不带/delete
    // 重要：使用GET方法而不是DELETE方法
    const response = await axios.get(`http://43.139.19.144:8000/events-db/${eventId}`, {
      timeout: 10000, // 添加超时设置
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting event ${eventId} via GET:`, error)

    // 提供更详细的错误信息
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500
      const errorMessage = error.response?.data?.error || error.message

      return NextResponse.json(
        { error: `删除失败: ${errorMessage}`, details: error.response?.data },
        { status: statusCode },
      )
    }

    return NextResponse.json({ error: "删除事件失败" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { eventId: string } }) {
  const { eventId } = params

  try {
    const body = await request.json()
    const { summary, category, status } = body

    // 构建请求体，只包含提供的字段
    const updateData: Record<string, any> = {}
    if (summary !== undefined) updateData.summary = summary
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status

    const response = await axios.put(`http://43.139.19.144:8000/events-db/${eventId}`, updateData)
    return NextResponse.json(response.data)
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}
