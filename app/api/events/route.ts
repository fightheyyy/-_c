import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    const response = await axios.get("http://43.139.19.144:8000/events-db")
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events", events: [] }, { status: 500 })
  }
}
