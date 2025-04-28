"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import axios from "axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ImageMessage {
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

interface AssociateImageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: number | undefined
  onImageAssociated: (imageUrl: string) => void
}

export function AssociateImageDialog({ isOpen, onClose, eventId, onImageAssociated }: AssociateImageDialogProps) {
  const [imageMessages, setImageMessages] = useState<ImageMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ImageMessage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAssociating, setIsAssociating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageMessage | null>(null)
  const { toast } = useToast()

  // 获取图片消息
  useEffect(() => {
    if (isOpen) {
      fetchImageMessages()
    }
  }, [isOpen])

  // 过滤图片消息
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = imageMessages.filter(
        (msg) =>
          (msg.message_content?.text && msg.message_content.text.toLowerCase().includes(query)) ||
          msg.sender_id.toLowerCase().includes(query) ||
          msg.message_id.toLowerCase().includes(query),
      )
      setFilteredMessages(filtered)
    } else {
      setFilteredMessages(imageMessages)
    }
  }, [searchQuery, imageMessages])

  const fetchImageMessages = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get("/api/messages/images")
      if (response.data) {
        setImageMessages(response.data)
        setFilteredMessages(response.data)
      }
    } catch (error) {
      console.error("获取图片消息失败:", error)
      toast({
        title: "获取图片失败",
        description: "无法获取可用的图片消息，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssociateImage = async () => {
    if (!selectedImage || !eventId) {
      toast({
        title: "关联失败",
        description: "请选择一张图片并确保卡片ID有效",
        variant: "destructive",
      })
      return
    }

    setIsAssociating(true)
    try {
      // 准备请求数据
      const imageData = {
        image_key: selectedImage.image_url?.split("/").pop() || `image_${Date.now()}.jpg`,
        sender_id: selectedImage.sender_id,
        timestamp: new Date(selectedImage.create_time).toISOString(),
        image_data: selectedImage.image_url || "",
        message_id: selectedImage.message_id,
      }

      // 发送关联请求
      const response = await axios.post(`/api/events/${eventId}/images`, imageData)

      if (response.data) {
        toast({
          title: "关联成功",
          description: "图片已成功关联到卡片",
        })

        // 通知父组件图片已关联
        onImageAssociated(selectedImage.image_url || "")
        onClose()
      }
    } catch (error) {
      console.error("关联图片失败:", error)
      toast({
        title: "关联失败",
        description: "无法关联图片到卡片，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsAssociating(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>关联图片到卡片</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索图片消息..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">加载图片消息中...</span>
            </div>
          ) : filteredMessages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`border rounded-md overflow-hidden cursor-pointer transition-all ${
                    selectedImage?.message_id === msg.message_id ? "ring-2 ring-primary" : "hover:border-primary"
                  }`}
                  onClick={() => setSelectedImage(msg)}
                >
                  <div className="relative aspect-video">
                    <Image src={msg.image_url || "/placeholder.svg"} alt="图片消息" fill className="object-cover" />
                  </div>
                  <div className="p-2 bg-muted/50">
                    <p className="text-xs truncate">发送者: {msg.sender_id}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(msg.create_time)}</p>
                    {msg.message_content?.text && <p className="text-xs truncate mt-1">{msg.message_content.text}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground">没有找到图片消息</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")}>
                  清除搜索
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isAssociating}>
            取消
          </Button>
          <Button
            onClick={handleAssociateImage}
            disabled={!selectedImage || isAssociating}
            className="flex items-center gap-2"
          >
            {isAssociating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAssociating ? "关联中..." : "关联图片"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
