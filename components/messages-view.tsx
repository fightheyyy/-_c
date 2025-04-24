"use client"

import { useState, useEffect } from "react"
import { getMessages } from "@/lib/api-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  type: string
  status?: string
}

interface MessagesViewProps {
  onBackToDashboard: () => void
}

export function MessagesView({ onBackToDashboard }: MessagesViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        const data = await getMessages()
        // 检查数据结构并适当处理
        if (data && Array.isArray(data)) {
          setMessages(data)
        } else if (data && data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages)
        } else {
          setMessages([])
          console.warn("API返回的数据格式不符合预期:", data)
        }
        setError(null)
      } catch (err) {
        setError("获取消息失败，请稍后重试")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBackToDashboard}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">消息列表</h2>
            <p className="text-sm text-muted-foreground">查看所有系统消息</p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">加载消息中...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full text-destructive">
            <p>{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <p>暂无消息</p>
          </div>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <span className="text-xs">{message.sender.slice(0, 2)}</span>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">{message.sender}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                  {message.status && (
                    <Badge variant={message.status === "已处理" ? "outline" : "default"}>{message.status}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
