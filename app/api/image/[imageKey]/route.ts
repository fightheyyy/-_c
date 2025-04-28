import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: Request, { params }: { params: { imageKey: string } }) {
  const imageKey = params.imageKey

  try {
    // 从外部API获取图片数据
    const response = await axios.get(`http://43.139.19.144:8000/get_image/${imageKey}`, {
      responseType: "arraybuffer",
    })

    // 确定图片类型
    const contentType = response.headers["content-type"] || "image/jpeg"

    // 返回图片数据
    return new NextResponse(response.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // 缓存24小时
      },
    })
  } catch (error) {
    console.error(`Error fetching image ${imageKey}:`, error)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
  }
}
