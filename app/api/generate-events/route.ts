import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    await axios.get("http://43.139.19.144:8000/generate_events")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error generating events:", error)
    return NextResponse.json({ error: "Failed to generate events" }, { status: 500 })
  }
}
