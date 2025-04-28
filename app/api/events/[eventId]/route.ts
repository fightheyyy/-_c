import { NextResponse } from "next/server"
import axios from "axios"

// 修改GET方法来处理删除操作，直接向后端发送GET请求
export async function GET(request: Request, { params }: { params: { eventId: string } }) {
  // 确保 params 是已解析的
  const { eventId } = params

  if (!eventId) {
    console.error("删除失败: 事件ID为空")
    return NextResponse.json({ error: "事件ID不能为空" }, { status: 400 })
  }

  console.log(`开始处理删除事件请求，ID: ${eventId}`)

  try {
    // 构建完整的后端API URL
    const apiUrl = `http://43.139.19.144:8000/events-db/${eventId}`
    console.log(`准备向后端发送GET请求: ${apiUrl}`)

    // 直接向后端发送GET请求
    const response = await axios.get(apiUrl, {
      timeout: 10000, // 添加超时设置
    })

    console.log(`删除事件成功，ID: ${eventId}, 响应状态: ${response.status}`)
    console.log(`响应数据: ${JSON.stringify(response.data)}`)

    return NextResponse.json(
      {
        success: true,
        message: `成功删除事件 ${eventId}`,
        status: response.status,
        data: response.data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`删除事件 ${eventId} 失败:`, error)

    // 提供更详细的错误信息
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500
      const errorMessage = error.response?.data?.error || error.message
      const errorConfig = {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
      }

      console.error(`Axios错误详情: 状态码=${statusCode}, 消息=${errorMessage}, 配置=`, errorConfig)

      return NextResponse.json(
        {
          error: `删除失败: ${errorMessage}`,
          details: error.response?.data,
          config: errorConfig,
        },
        { status: statusCode },
      )
    }

    return NextResponse.json(
      {
        error: "删除事件失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
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
