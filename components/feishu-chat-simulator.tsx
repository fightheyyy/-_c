"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Send, ArrowLeft, ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { IssueCard } from "@/lib/types"

// 在文件顶部导入新的API服务函数
import { getRawMessages, generateEvents } from "@/lib/api-service"

interface FeishuChatSimulatorProps {
  onBackToDashboard: () => void
  onNewIssueCreated: (issue: IssueCard) => void
  currentUser: { name: string; username: string }
}

type MessageType = "text" | "image" | "system" | "ai-processing" | "ai-response"

interface Message {
  id: string
  type: MessageType
  content: string
  sender: string
  timestamp: Date
  imageUrl?: string
}

export function FeishuChatSimulator({ onBackToDashboard, onNewIssueCreated, currentUser }: FeishuChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "欢迎来到项目群聊，您可以@巡检记录助手 记录现场问题",
      sender: "system",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // 在FeishuChatSimulator组件内添加新的状态变量
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isGeneratingEvents, setIsGeneratingEvents] = useState(false)

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedImages((prev) => [...prev, ...filesArray])

      // 创建预览URL
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])

      // 发送图片消息
      filesArray.forEach((file, index) => {
        const newMessage: Message = {
          id: `img-${Date.now()}-${index}`,
          type: "image",
          content: "",
          sender: currentUser.name,
          timestamp: new Date(),
          imageUrl: newPreviewUrls[index],
        }
        setMessages((prev) => [...prev, newMessage])
      })
    }
  }

  // 清除预览URL以防内存泄漏
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    // 检查是否@了巡检记录助手
    const isAtBot = inputMessage.includes("@巡检记录助手")
    const messageContent = inputMessage.replace("@巡检记录助手", "").trim()

    // 添加用户消息
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      type: "text",
      content: inputMessage,
      sender: currentUser.name,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
    setInputMessage("")

    // 如果@了巡检记录助手，模拟AI响应
    if (isAtBot) {
      // 添加AI处理中的消息
      const processingMessage: Message = {
        id: `ai-proc-${Date.now()}`,
        type: "ai-processing",
        content: "正在处理您的请求...",
        sender: "巡检记录助手",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, processingMessage])
      setIsProcessing(true)

      // 模拟AI处理延迟
      setTimeout(() => {
        // 获取最近的图片消息
        const recentImages = messages
          .filter((msg) => msg.type === "image" && new Date().getTime() - msg.timestamp.getTime() < 60000)
          .map((msg) => msg.imageUrl)
          .filter((url): url is string => !!url)

        // 模拟AI生成问题记录
        const issueId = `IR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
          Math.random() * 1000,
        )
          .toString()
          .padStart(3, "0")}`

        // 根据消息内容生成问题描述
        let description = messageContent
        let location = ""
        let responsibleParty = ""

        // 简单的位置和责任单位提取逻辑
        const locationMatch = messageContent.match(/在(.{1,10}(区|楼|层|道|路|厅|间))/i)
        if (locationMatch) {
          location = locationMatch[1]
          description = description.replace(locationMatch[0], `[${location}]`)
        }

        const partyMatch = messageContent.match(/(请|责任单位是|通知)(.{2,10}(单位|公司|队|班组|总包|分包))/i)
        if (partyMatch) {
          responsibleParty = partyMatch[2]
          description = description.replace(partyMatch[0], `请[${responsibleParty}]`)
        }

        // 创建新的问题卡片
        const newIssue: IssueCard = {
          id: issueId,
          originalMessageIds: [newMessage.id],
          reporterUserId: currentUser.username,
          reporterName: currentUser.name,
          recordTimestamp: new Date().toISOString(),
          rawTextInput: messageContent,
          imageUrls: recentImages.length > 0 ? recentImages : ["/placeholder.svg?key=723nb"],
          description: description,
          location: location || "未指定位置",
          responsibleParty: responsibleParty || "未指定责任单位",
          status: "待处理",
          lastUpdatedTimestamp: new Date().toISOString(),
          projectId: "project123",
          isDeleted: false,
        }

        // 添加AI响应消息
        const aiResponseMessage: Message = {
          id: `ai-resp-${Date.now()}`,
          type: "ai-response",
          content: `✅ 已创建问题记录 #${issueId}\n\n问题描述：${description}\n\n状态：待处理\n记录时间：${new Date().toLocaleString(
            "zh-CN",
          )}\n记录人：${currentUser.name}\n\n您可以在H5看板中查看详情并进行后续操作`,
          sender: "巡检记录助手",
          timestamp: new Date(),
        }
        setMessages((prev) => prev.filter((msg) => msg.type !== "ai-processing").concat(aiResponseMessage))
        setIsProcessing(false)

        // 通知父组件新问题已创建
        onNewIssueCreated(newIssue)

        // 显示通知
        toast({
          title: "问题记录已创建",
          description: `问题记录 #${issueId} 已成功创建`,
        })
      }, 2000)
    }
  }

  // 在组件内添加新的useEffect钩子，用于获取原始消息
  useEffect(() => {
    const fetchRawMessages = async () => {
      try {
        setIsLoadingMessages(true)
        const data = await getRawMessages()
        if (data.messages && data.messages.length > 0) {
          // 转换API返回的消息格式为组件内部使用的格式
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: msg.type || "text",
            content: msg.content,
            sender: msg.sender || "系统",
            timestamp: new Date(msg.timestamp || Date.now()),
            imageUrl: msg.imageUrl,
          }))
          setMessages(formattedMessages)
        }
      } catch (error) {
        console.error("获取原始消息失败:", error)
        toast({
          title: "获取消息失败",
          description: "无法从服务器获取消息，请稍后重试",
          variant: "destructive",
        })
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchRawMessages()
  }, [toast]) // 添加toast作为依赖项

  // 添加处理AI生成事件的函数
  const handleGenerateEvents = async () => {
    try {
      setIsGeneratingEvents(true)
      const result = await generateEvents()

      toast({
        title: "事件生成成功",
        description: `成功生成了 ${result.count || 0} 个事件`,
      })

      // 如果API返回了新消息，可以添加到当前消息列表
      if (result.messages && result.messages.length > 0) {
        const newMessages = result.messages.map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: msg.type || "text",
          content: msg.content,
          sender: msg.sender || "AI助手",
          timestamp: new Date(msg.timestamp || Date.now()),
          imageUrl: msg.imageUrl,
        }))

        setMessages((prev) => [...prev, ...newMessages])
      }
    } catch (error) {
      console.error("生成事件失败:", error)
      toast({
        title: "生成事件失败",
        description: "无法生成事件，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingEvents(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBackToDashboard}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">东方明珠二期工程 - 监理团队</h2>
            <p className="text-sm text-muted-foreground">25人 · 飞书群聊</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateEvents}
            disabled={isGeneratingEvents}
            className="flex items-center gap-1"
          >
            {isGeneratingEvents ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                生成中...
              </>
            ) : (
              <>AI生成事件</>
            )}
          </Button>
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">加载消息中...</span>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                {message.type === "system" ? (
                  <div className="self-center bg-muted px-3 py-1 rounded-md text-xs text-muted-foreground">
                    {message.content}
                  </div>
                ) : (
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      message.sender === currentUser.name ? "self-end flex-row-reverse" : "self-start"
                    }`}
                  >
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <span className="text-xs">{message.sender.slice(0, 2)}</span>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{message.sender}</span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {message.type === "text" && (
                        <Card
                          className={`${
                            message.sender === currentUser.name ? "bg-primary text-primary-foreground" : "bg-background"
                          }`}
                        >
                          <CardContent className="p-3 text-sm whitespace-pre-wrap">{message.content}</CardContent>
                        </Card>
                      )}
                      {message.type === "image" && message.imageUrl && (
                        <div className="rounded-lg overflow-hidden border max-w-xs">
                          <Image
                            src={message.imageUrl || "/placeholder.svg"}
                            alt="上传的图片"
                            width={300}
                            height={200}
                            className="object-cover"
                          />
                        </div>
                      )}
                      {message.type === "ai-processing" && (
                        <Card>
                          <CardContent className="p-3 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{message.content}</span>
                          </CardContent>
                        </Card>
                      )}
                      {message.type === "ai-response" && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3 text-sm whitespace-pre-wrap">{message.content}</CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <ImageIcon className="h-5 w-5" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
              disabled={isProcessing}
            />
          </Button>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="输入消息，@巡检记录助手 记录问题..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={isProcessing}
            />
            <Button type="button" onClick={handleSendMessage} disabled={!inputMessage.trim() || isProcessing}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
