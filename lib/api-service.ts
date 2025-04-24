// API服务，用于处理所有与后端的通信
export async function getMessages() {
  try {
    const response = await fetch("http://43.139.19.144:8000/get_Messages")
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("获取消息失败:", error)
    throw error
  }
}

export async function getRawMessages() {
  try {
    const response = await fetch("http://43.139.19.144:8000/get_RawMessages")
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("获取原始消息失败:", error)
    throw error
  }
}

export async function generateEvents() {
  try {
    const response = await fetch("http://43.139.19.144:8000/generate_events")
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("生成事件失败:", error)
    throw error
  }
}
