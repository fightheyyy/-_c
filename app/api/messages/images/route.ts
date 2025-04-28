import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    // 获取所有消息
    const response = await axios.get("http://43.139.19.144:8000/get_Messages")
    const messages = response.data || []

    // 过滤出包含图片的消息
    const imageMessages = messages.filter((msg: any) => msg.msg_type === "image" || msg.image_url)

    return NextResponse.json(imageMessages)
  } catch (error) {
    console.error("Error fetching image messages:", error)
    return NextResponse.json({ error: "获取图片消息失败" }, { status: 500 })
  }
}
