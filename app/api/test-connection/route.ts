import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    // 测试连接
    console.log("测试API连接: http://43.139.19.144:8000/events-db")

    // 使用fetch API作为替代方法
    const fetchResponse = await fetch("http://43.139.19.144:8000/events-db", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // 增加超时时间
      signal: AbortSignal.timeout(10000),
    })

    const fetchStatus = fetchResponse.status
    const fetchOk = fetchResponse.ok
    let fetchData = null

    try {
      fetchData = await fetchResponse.json()
    } catch (e) {
      console.error("解析fetch响应JSON失败:", e)
    }

    // 使用axios作为第二种方法
    let axiosResponse = null
    let axiosError = null

    try {
      axiosResponse = await axios.get("http://43.139.19.144:8000/events-db", {
        timeout: 10000,
      })
    } catch (e) {
      axiosError = e
      console.error("Axios请求失败:", e)
    }

    // 返回诊断信息
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      fetch: {
        status: fetchStatus,
        ok: fetchOk,
        data: fetchData ? "获取成功" : "获取失败",
        dataSize: fetchData ? JSON.stringify(fetchData).length : 0,
      },
      axios: {
        success: axiosResponse !== null,
        status: axiosResponse?.status || axiosError?.response?.status || "无响应",
        error: axiosError ? axiosError.message || "未知错误" : null,
        dataSize: axiosResponse ? JSON.stringify(axiosResponse.data).length : 0,
      },
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("测试连接失败:", error)
    return NextResponse.json(
      {
        error: "测试连接失败",
        message: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
