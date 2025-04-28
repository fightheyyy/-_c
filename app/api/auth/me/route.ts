import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request) {
  try {
    // 从请求头中获取认证令牌
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({ message: "未提供认证令牌" }, { status: 401 })
    }

    // 调用外部API获取用户信息
    const response = await axios.get("http://43.139.19.144:8000/users/me", {
      headers: {
        Authorization: authHeader,
      },
      timeout: 10000,
    })

    // 返回用户信息
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("获取用户信息失败:", error)

    // 检查是否是Axios错误
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500
      const errorMessage = error.response?.data?.detail || "获取用户信息失败"

      return NextResponse.json({ message: errorMessage }, { status: statusCode })
    }

    return NextResponse.json({ message: "获取用户信息服务暂时不可用" }, { status: 500 })
  }
}
