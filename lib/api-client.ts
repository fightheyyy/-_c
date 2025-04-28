import axios from "axios"
import { mockIssueCards } from "./mock-data"
import type { IssueCard } from "./types"

// API基础URL
const API_BASE_URL = "http://43.139.19.144:8000"

// 超时设置
const DEFAULT_TIMEOUT = 10000

// 重试配置
const MAX_RETRIES = 2
const RETRY_DELAY = 1000

// 获取认证令牌
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null

  try {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      if (user.token) {
        return `${user.tokenType || "Bearer"} ${user.token}`
      }
    }
  } catch (error) {
    console.error("获取认证令牌失败:", error)
  }

  return null
}

/**
 * 带重试功能的API请求
 */
export async function fetchWithRetry<T>(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<T> {
  try {
    // 添加认证头
    const token = getAuthToken()
    const headers = new Headers(options.headers || {})

    if (token) {
      headers.set("Authorization", token)
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(DEFAULT_TIMEOUT),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return (await response.json()) as T
  } catch (error) {
    if (retries > 0) {
      console.log(`请求失败，${RETRY_DELAY}ms后重试，剩余重试次数: ${retries - 1}`)
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry<T>(url, options, retries - 1)
    }
    throw error
  }
}

/**
 * 获取问题卡片，失败时使用模拟数据
 */
export async function getIssueCards(): Promise<IssueCard[]> {
  try {
    console.log("尝试从API获取问题卡片...")

    // 获取认证令牌
    const token = getAuthToken()
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = token
    }

    const response = await axios.get(`${API_BASE_URL}/events-db`, {
      timeout: DEFAULT_TIMEOUT,
      headers,
    })

    if (response.data && response.data.events) {
      console.log(`成功从API获取 ${response.data.events.length} 个问题卡片`)
      // 转换API数据为IssueCard格式
      return response.data.events.map((event: any) => {
        // 提取第一条消息作为原始输入
        const firstMessage = event.messages && event.messages.length > 0 ? event.messages[0].content : ""

        // 提取图片URL
        const imageUrls =
          event.candidate_images && event.candidate_images.length > 0
            ? event.candidate_images.map((img: any) => img.image_data || `/api/image/${img.image_key}`)
            : ["/placeholder.svg?key=event-image"]

        // 从消息中提取位置和责任单位
        let location = ""
        let responsibleParty = ""

        // 尝试从摘要或消息中提取位置
        const locationMatch = event.summary.match(/(\d+号楼|\w区|\w座)/)
        if (locationMatch && locationMatch[1]) {
          location = locationMatch[1]
        }

        // 责任单位暂时设为默认值，后续可以根据实际数据调整
        responsibleParty = "待指定"

        return {
          id: event.id.toString(),
          eventId: event.id,
          originalMessageIds: event.messages ? event.messages.map((m: any) => m.message_id) : [],
          reporterUserId: event.messages && event.messages.length > 0 ? event.messages[0].sender_id : "unknown",
          reporterName: "系统聚类",
          recordTimestamp: event.create_time || new Date().toISOString(),
          rawTextInput: firstMessage,
          imageUrls: imageUrls,
          description: event.summary || "未提供描述",
          location: location || "未指定位置",
          responsibleParty: responsibleParty,
          status:
            event.status === "0"
              ? "待处理"
              : event.status === "1"
                ? "整改中"
                : event.status === "2"
                  ? "待复核"
                  : "已闭环",
          lastUpdatedTimestamp: event.update_time || new Date().toISOString(),
          projectId: "project123",
          isDeleted: false,
          isMergedCard: event.is_merged || false,
        }
      })
    }

    throw new Error("API响应格式不正确")
  } catch (error) {
    console.error("获取问题卡片失败，使用模拟数据:", error)
    return mockIssueCards
  }
}

/**
 * 检查API服务器状态
 */
export async function checkApiStatus(): Promise<{
  isAvailable: boolean
  message: string
  timestamp: string
}> {
  try {
    const startTime = Date.now()
    // 使用events-db接口而不是health接口
    const response = await axios.get(`${API_BASE_URL}/events-db`, {
      timeout: 5000, // 较短的超时时间用于状态检查
      headers: {
        Accept: "application/json",
        Authorization: getAuthToken() || "",
      },
    })
    const endTime = Date.now()

    return {
      isAvailable: true,
      message: `API服务器可用，响应时间: ${endTime - startTime}ms`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      isAvailable: false,
      message: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString(),
    }
  }
}
