import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    // 检查API服务器状态
    const apiCheck = await checkApiServer()

    return NextResponse.json({
      status: "ok",
      api: apiCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("健康检查失败:", error)

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

async function checkApiServer() {
  try {
    const startTime = Date.now()
    const response = await axios.get("http://43.139.19.144:8000/health", {
      timeout: 5000,
    })
    const endTime = Date.now()

    return {
      status: "available",
      responseTime: endTime - startTime,
      details: response.data,
    }
  } catch (error) {
    return {
      status: "unavailable",
      error: error instanceof Error ? error.message : "未知错误",
    }
  }
}
