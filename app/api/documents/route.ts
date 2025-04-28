import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    // 调用外部API获取所有文档
    const response = await axios.get("http://43.139.19.144:8000/get_AllDocs", {
      timeout: 10000, // 10秒超时
    })

    // 返回API响应
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("获取文档列表失败:", error)

    // 提供详细的错误信息
    const errorMessage = error.response?.data?.error || error.message || "未知错误"
    const statusCode = error.response?.status || 500

    return NextResponse.json({ error: `获取文档列表失败: ${errorMessage}` }, { status: statusCode })
  }
}
