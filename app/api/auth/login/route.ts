import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ message: "用户名和密码不能为空" }, { status: 400 })
    }

    console.log("尝试登录，用户名:", username)

    // 调用外部API进行认证
    const response = await axios.post(
      "http://43.139.19.144:8000/token",
      { username, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10秒超时
      },
    )

    // 返回认证结果
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("登录失败:", error)

    // 检查是否是Axios错误
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500
      const errorMessage = error.response?.data?.detail || "登录失败，请检查用户名和密码"

      return NextResponse.json({ message: errorMessage }, { status: statusCode })
    }

    return NextResponse.json({ message: "登录服务暂时不可用，请稍后再试" }, { status: 500 })
  }
}
