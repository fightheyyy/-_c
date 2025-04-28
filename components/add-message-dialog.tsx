"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import axios from "axios"

interface AddMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string | number | null
  onMessageAdded: (messageContent: string) => void
}

export function AddMessageDialog({ isOpen, onClose, eventId, onMessageAdded }: AddMessageDialogProps) {
  const [messageContent, setMessageContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageContent.trim()) {
      toast({
        title: "内容不能为空",
        description: "请输入消息内容",
        variant: "destructive",
      })
      return
    }

    if (!eventId) {
      toast({
        title: "添加失败",
        description: "未找到对应的事件ID",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 准备消息数据
      const messageData = {
        message_id: `om_${Date.now()}`, // 生成临时ID
        type: "text",
        content: messageContent,
        sender_id: "current_user", // 可以从用户会话中获取
        timestamp: new Date().toISOString(),
      }

      // 调用API添加消息
      const response = await axios.post("/api/proxy/add-message", {
        eventId,
        messageData,
      })

      if (response.data) {
        toast({
          title: "添加成功",
          description: "消息已成功添加到卡片",
        })

        // 通知父组件
        onMessageAdded(messageContent)

        // 重置表单
        setMessageContent("")
        onClose()
      }
    } catch (error: any) {
      console.error("添加消息失败:", error)
      toast({
        title: "添加失败",
        description: error.response?.data?.error || "无法添加消息，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>添加关联消息</DialogTitle>
            <DialogDescription>为当前卡片添加一条新的关联消息。添加后将显示在卡片详情中。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">消息内容</Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="输入消息内容..."
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                "添加消息"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
