import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    console.log("开始请求API: http://43.139.19.144:8000/events-db")

    // 添加更多配置选项来帮助诊断问题
    const response = await axios.get("http://43.139.19.144:8000/events-db", {
      timeout: 15000, // 增加超时时间到15秒
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // 添加代理配置，如果在某些环境中需要
      // proxy: false, // 禁用代理，直接连接
      validateStatus: (status) => {
        return status >= 200 && status < 600 // 接受所有状态码，以便我们可以记录它们
      },
    })

    console.log("API响应状态:", response.status)
    console.log("API响应头:", JSON.stringify(response.headers))

    // 检查响应状态
    if (response.status >= 400) {
      console.error("API错误响应:", response.status, response.statusText, response.data)
      return NextResponse.json(
        {
          error: `API返回错误: ${response.status} ${response.statusText}`,
          details: response.data,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(response.data)
  } catch (error) {
    // 提供更详细的错误信息
    console.error("获取events失败:", error)

    // 检查是否是Axios错误
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500
      const errorMessage = error.response?.data?.error || error.message
      const errorCode = error.code
      const errorConfig = error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            timeout: error.config.timeout,
          }
        : {}

      console.error("Axios错误详情:", {
        statusCode,
        errorMessage,
        errorCode,
        errorConfig,
      })

      // 检查是否是网络错误
      if (error.code === "ECONNREFUSED" || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return NextResponse.json(
          {
            error: "无法连接到API服务器，请检查网络连接或服务器状态",
            code: error.code,
            message: error.message,
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: `请求失败: ${errorMessage}`,
          code: errorCode,
          details: error.response?.data,
        },
        { status: statusCode },
      )
    }

    return NextResponse.json(
      {
        error: "获取events失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}
