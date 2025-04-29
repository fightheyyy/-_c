"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface MessageDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  messageId: string
}

interface MessageDetail {
  message_id: string
  msg_type: string
  create_time: number
  sender_id: string
  message_content: {
    text: string
  }
  image_url: string | null
  status: string
}

export function MessageDetailDialog({ isOpen, onClose, messageId }: MessageDetailDialogProps) {
  const [message, setMessage] = useState<MessageDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && messageId) {
      fetchMessageDetail()
    }
  }, [isOpen, messageId])

  const fetchMessageDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 这里假设有一个API端点可以获取消息详情
      // 实际实现中，你可能需要创建这个API端点
      const response = await axios.get(`/api/messages/${messageId}`)
      if (response.data) {
        setMessage(response.data)
      }
    } catch (error) {
      console.error("获取消息详情失败:", error)
      setError("无法获取消息详情，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>消息详情</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">加载消息中...</span>
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8">{error}</div>
          ) : message ? (
            <div className="space-y-4">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <div className="font-medium text-sm">消息ID:</div>
                <div className="text-sm break-all">{message.message_id}</div>

                <div className="font-medium text-sm">发送者:</div>
                <div className="text-sm">{message.sender_id}</div>

                <div className="font-medium text-sm">发送时间:</div>
                <div className="text-sm">{formatDate(message.create_time)}</div>

                <div className="font-medium text-sm">消息类型:</div>
                <div className="text-sm">{message.msg_type}</div>
              </div>

              <div>
                <div className="font-medium text-sm mb-1">消息内容:</div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {message.message_content?.text || "无文本内容"}
                </div>
              </div>

              {message.image_url && (
                <div>
                  <div className="font-medium text-sm mb-1">图片:</div>
                  <div className="border rounded-md overflow-hidden">
                    <img src={message.image_url || "/placeholder.svg"} alt="消息图片" className="w-full h-auto" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">未找到消息详情</div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
