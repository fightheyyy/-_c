import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_ids } = body

    if (!event_ids || !Array.isArray(event_ids) || event_ids.length < 2) {
      return NextResponse.json({ error: "至少需要选择两个有效的事件ID进行合并" }, { status: 400 })
    }

    // 调用外部API进行合并
    const response = await axios.post("http://43.139.19.144:8000/merge-events", {
      event_ids,
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error merging events:", error)
    return NextResponse.json({ error: "合并事件失败，请稍后再试" }, { status: 500 })
  }
}
