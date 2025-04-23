// API服务，用于处理所有与后端的通信
export async function getMessages() {
  try {
    const response = await fetch("/api/get_Messages")
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
    const response = await fetch("/api/get_RawMessages")
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
    const response = await fetch("/api/generate_events")
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("生成事件失败:", error)
    throw error
  }
}

// 新增事件相关API调用函数
export async function getEventsFromDB() {
  try {
    const response = await fetch("/api/events-db")
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("获取事件数据失败:", error)
    throw error
  }
}

export async function createEvent(eventData: any) {
  try {
    const response = await fetch("/api/event_routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    })
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("创建事件失败:", error)
    throw error
  }
}

export async function updateEvent(eventId: string, eventData: any) {
  try {
    const response = await fetch(`/api/event_update/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    })
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("更新事件失败:", error)
    throw error
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const response = await fetch(`/api/event_routes/${eventId}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("删除事件失败:", error)
    throw error
  }
}

export async function getEventById(eventId: string) {
  try {
    const response = await fetch(`/api/event_routes/${eventId}`)
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("获取事件详情失败:", error)
    throw error
  }
}
