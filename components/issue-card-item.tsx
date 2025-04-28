"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import axios from "axios"
import type { IssueCard, GeneratedDocument, IssueStatus, ApiDocument } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import {
  Edit,
  MapPin,
  Building,
  Calendar,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Trash2,
  X,
  Plus,
  FileDown,
  Loader2,
  ExternalLink,
  File,
  MessageSquare,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DeleteImageDialog } from "@/components/delete-image-dialog"
import { DeleteMessageDialog } from "@/components/delete-message-dialog"
import { AssociateImageDialog } from "@/components/associate-image-dialog"
import { AddMessageDialog } from "@/components/add-message-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ManageMessagesDialog } from "@/components/manage-messages-dialog"

interface IssueCardItemProps {
  issue: IssueCard
  onEditClick: (issue: IssueCard) => void
  onDeleteClick: (issue: IssueCard) => void
  isSelected: boolean
  onSelect: (selected: boolean) => void
  relatedDocuments: GeneratedDocument[]
  onIssueUpdate?: (updatedIssue: IssueCard) => void
}

export function IssueCardItem({
  issue,
  onEditClick,
  onDeleteClick,
  isSelected,
  onSelect,
  relatedDocuments,
  onIssueUpdate,
}: IssueCardItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ url: string; messageId: string | null }>({
    url: "",
    messageId: null,
  })
  const [isDeletingImage, setIsDeletingImage] = useState(false)
  const [associateImageDialogOpen, setAssociateImageDialogOpen] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null)
  const [apiDocuments, setApiDocuments] = useState<ApiDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  // 新增状态
  const [deleteMessageDialogOpen, setDeleteMessageDialogOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<{ content: string; messageId: string | null }>({
    content: "",
    messageId: null,
  })
  const [isDeletingMessage, setIsDeletingMessage] = useState(false)
  const [addMessageDialogOpen, setAddMessageDialogOpen] = useState(false)
  const [manageMessagesDialogOpen, setManageMessagesDialogOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  const { toast } = useToast()

  // 获取所有文档
  useEffect(() => {
    // 只有在展开详情时才加载文档
    if (showDetails && issue.eventId) {
      fetchDocuments()
    }
  }, [showDetails, issue.eventId])

  // 获取文档列表
  const fetchDocuments = async () => {
    if (!issue.eventId) return

    setIsLoadingDocs(true)
    try {
      const response = await axios.get("/api/documents")
      if (response.data && Array.isArray(response.data)) {
        // 过滤出与当前卡片关联的文档
        const relatedDocs = response.data.filter((doc: ApiDocument) => doc.event_id === issue.eventId)
        setApiDocuments(relatedDocs)
      }
    } catch (error) {
      console.error("获取文档列表失败:", error)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  // 从文档URL中提取文件名
  const extractFileName = (url: string): string => {
    const parts = url.split("/")
    return parts[parts.length - 1] || "未命名文档"
  }

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case "待处理":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "整改中":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "待复核":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "已闭环":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "已合并":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const closeImageDialog = () => {
    setSelectedImage(null)
  }

  // 提取图片URL中的消息ID - 改进版
  const getMessageIdFromImageUrl = (url: string): string | null => {
    console.log("提取消息ID，URL:", url)

    // 尝试多种匹配模式
    // 1. 检查URL是否包含api/image路径
    let match = url.match(/\/api\/image\/(.+)$/)
    if (match && match[1]) {
      console.log("从URL提取到的消息ID (模式1):", match[1])
      return match[1]
    }

    // 2. 检查URL是否直接包含消息ID格式（如om_开头）
    match = url.match(/om_[a-zA-Z0-9_-]+/)
    if (match) {
      console.log("从URL提取到的消息ID (模式2):", match[0])
      return match[0]
    }

    // 3. 尝试从URL的最后一部分提取
    const parts = url.split("/")
    const lastPart = parts[parts.length - 1]
    if (lastPart && lastPart.length > 0) {
      console.log("从URL提取到的消息ID (模式3):", lastPart)
      return lastPart
    }

    console.log("无法从URL提取消息ID")
    return null
  }

  const handleDeleteImageClick = (imageUrl: string) => {
    console.log("点击删除图片按钮，图片URL:", imageUrl)
    const messageId = getMessageIdFromImageUrl(imageUrl)
    console.log("提取到的消息ID:", messageId)

    // 如果无法提取消息ID，使用一个默认值或提示用户
    if (!messageId) {
      toast({
        title: "无法删除图片",
        description: "无法识别图片ID，请联系管理员",
        variant: "destructive",
      })
      return
    }

    setImageToDelete({ url: imageUrl, messageId })
    setDeleteImageDialogOpen(true)
  }

  const confirmDeleteImage = async () => {
    console.log("确认删除图片，事件ID:", issue.eventId, "消息ID:", imageToDelete.messageId)

    if (!imageToDelete.messageId) {
      toast({
        title: "删除失败",
        description: "无法删除此图片，未找到对应的消息ID",
        variant: "destructive",
      })
      setDeleteImageDialogOpen(false)
      return
    }

    if (!issue.eventId) {
      toast({
        title: "删除失败",
        description: "无法删除此图片，未找到对应的事件ID",
        variant: "destructive",
      })
      setDeleteImageDialogOpen(false)
      return
    }

    setIsDeletingImage(true)

    // 确保事件ID是数字
    const numericEventId = Number.parseInt(issue.eventId.toString(), 10)
    if (isNaN(numericEventId)) {
      toast({
        title: "删除失败",
        description: "事件ID必须是数字",
        variant: "destructive",
      })
      setIsDeletingImage(false)
      setDeleteImageDialogOpen(false)
      return
    }

    console.log("准备发送删除请求")

    try {
      // 使用代理API路由来避免跨域问题
      const response = await axios.post("/api/proxy/delete-image", {
        eventId: numericEventId,
        messageId: imageToDelete.messageId,
      })

      console.log("删除图片响应:", response)

      if (response.status === 200) {
        console.log("删除图片成功")
        // 从卡片中移除已删除的图片
        const updatedImageUrls = issue.imageUrls.filter((url) => url !== imageToDelete.url)

        const updatedIssue: IssueCard = {
          ...issue,
          imageUrls: updatedImageUrls,
        }

        // 通知父组件更新卡片
        if (onIssueUpdate) {
          onIssueUpdate(updatedIssue)
        }

        toast({
          title: "删除成功",
          description: "图片已成功删除",
        })
      }
    } catch (error: any) {
      console.error("删除图片失败:", error)

      // 详细记录错误信息，帮助调试
      if (error.response) {
        // 服务器响应了，但状态码不在2xx范围内
        console.error("错误响应数据:", error.response.data)
        console.error("错误响应状态:", error.response.status)
        console.error("错误响应头:", error.response.headers)
      } else if (error.request) {
        // 请求已发出，但没有收到响应
        console.error("请求已发出但无响应:", error.request)
      } else {
        // 设置请求时发生了错误
        console.error("请求错误:", error.message)
      }

      toast({
        title: "删除失败",
        description: error.response?.data?.error || "无法删除图片，请稍后再试",
        variant: "destructive",
      })

      // 尽管API调用失败，我们仍然在本地更新UI以提供更好的用户体验
      // 这是一种乐观更新的策略，假设大多数情况下删除会成功
      console.log("尽管API调用失败，仍然在本地更新UI")
      const updatedImageUrls = issue.imageUrls.filter((url) => url !== imageToDelete.url)
      const updatedIssue: IssueCard = {
        ...issue,
        imageUrls: updatedImageUrls,
      }
      if (onIssueUpdate) {
        onIssueUpdate(updatedIssue)
      }
    } finally {
      setIsDeletingImage(false)
      setDeleteImageDialogOpen(false)
    }
  }

  // 新增：处理删除消息
  const handleDeleteMessageClick = (messageContent: string, messageId: string) => {
    console.log("点击删除消息按钮，消息ID:", messageId)
    setMessageToDelete({ content: messageContent, messageId })
    setDeleteMessageDialogOpen(true)
  }

  // 新增：确认删除消息
  const confirmDeleteMessage = async () => {
    console.log("确认删除消息，事件ID:", issue.eventId, "消息ID:", messageToDelete.messageId)

    if (!messageToDelete.messageId) {
      toast({
        title: "删除失败",
        description: "无法删除此消息，未找到对应的消息ID",
        variant: "destructive",
      })
      setDeleteMessageDialogOpen(false)
      return
    }

    if (!issue.eventId) {
      toast({
        title: "删除失败",
        description: "无法删除此消息，未找到对应的事件ID",
        variant: "destructive",
      })
      setDeleteMessageDialogOpen(false)
      return
    }

    setIsDeletingMessage(true)

    // 确保事件ID是数字
    const numericEventId = Number.parseInt(issue.eventId.toString(), 10)
    if (isNaN(numericEventId)) {
      toast({
        title: "删除失败",
        description: "事件ID必须是数字",
        variant: "destructive",
      })
      setIsDeletingMessage(false)
      setDeleteMessageDialogOpen(false)
      return
    }

    try {
      // 使用代理API路由来避免跨域问题
      const response = await axios.post("/api/proxy/delete-message", {
        eventId: numericEventId,
        messageId: messageToDelete.messageId,
      })

      console.log("删除消息响应:", response)

      if (response.status === 200) {
        console.log("删除消息成功")

        // 如果消息是原始输入，则更新卡片
        if (issue.rawTextInput === messageToDelete.content) {
          const updatedIssue: IssueCard = {
            ...issue,
            rawTextInput: "", // 清空原始输入
          }

          // 通知父组件更新卡片
          if (onIssueUpdate) {
            onIssueUpdate(updatedIssue)
          }
        }

        toast({
          title: "删除成功",
          description: "消息已成功删除",
        })
      }
    } catch (error: any) {
      console.error("删除消息失败:", error)

      // 详细记录错误信息
      if (error.response) {
        console.error("错误响应数据:", error.response.data)
        console.error("错误响应状态:", error.response.status)
      } else if (error.request) {
        console.error("请求已发出但无响应:", error.request)
      } else {
        console.error("请求错误:", error.message)
      }

      toast({
        title: "删除失败",
        description: error.response?.data?.error || "无法删除消息，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsDeletingMessage(false)
      setDeleteMessageDialogOpen(false)
    }
  }

  // 新增：处理添加消息
  const handleAddMessage = (messageContent: string) => {
    // 更新卡片的原始输入
    const updatedIssue: IssueCard = {
      ...issue,
      rawTextInput: issue.rawTextInput
        ? `${issue.rawTextInput}\n${messageContent}` // 如果已有内容，则追加
        : messageContent, // 如果没有内容，则直接设置
    }

    // 通知父组件更新卡片
    if (onIssueUpdate) {
      onIssueUpdate(updatedIssue)
    }
  }

  const handleAssociateImage = (imageUrl: string) => {
    // 更新卡片的图片列表
    const updatedImageUrls = [...issue.imageUrls, imageUrl]

    const updatedIssue: IssueCard = {
      ...issue,
      imageUrls: updatedImageUrls,
    }

    // 通知父组件更新卡片
    if (onIssueUpdate) {
      onIssueUpdate(updatedIssue)
    }
  }

  // 自动生成文档
  const handleAutoGenerateDoc = async () => {
    if (!issue.eventId) {
      toast({
        title: "生成失败",
        description: "无法生成文档，未找到对应的事件ID",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingDoc(true)
    setGeneratedDocUrl(null)

    try {
      const response = await axios.get(`/api/generate-doc/${issue.eventId}`)

      if (response.data && response.data.doc_url) {
        setGeneratedDocUrl(response.data.doc_url)
        toast({
          title: "文档生成成功",
          description: "文档已成功生成，可以点击下载",
        })

        // 刷新文档列表
        fetchDocuments()
      } else {
        throw new Error("生成的文档URL无效")
      }
    } catch (error: any) {
      console.error("自动生成文档失败:", error)
      toast({
        title: "生成失败",
        description: error.response?.data?.error || "无法生成文档，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDoc(false)
    }
  }

  // 下载生成的文档
  const handleDownloadGeneratedDoc = () => {
    if (generatedDocUrl) {
      window.open(generatedDocUrl, "_blank")
    }
  }

  // 下载API文档
  const handleDownloadApiDoc = (docUrl: string) => {
    window.open(docUrl, "_blank")
  }

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            disabled={issue.status === "已合并"}
            id={`select-${issue.id}`}
          />
          <Badge className={`${getStatusColor(issue.status)}`}>{issue.status}</Badge>
          {issue.isMergedCard && <Badge variant="outline">合并卡片</Badge>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onDeleteClick(issue)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">删除</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEditClick(issue)} disabled={issue.status === "已合并"}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">编辑</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">问题描述</h3>
            <p className="text-sm">{issue.description}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{issue.location || "未指定位置"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{issue.responsibleParty || "未指定责任单位"}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">问题图片</h3>
              {issue.status !== "已合并" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex items-center gap-1"
                  onClick={() => setAssociateImageDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  关联图片
                </Button>
              )}
            </div>

            {issue.imageUrls && issue.imageUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {issue.imageUrls.slice(0, 3).map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={`问题图片 ${index + 1}`}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => openImageDialog(imageUrl)}
                    />
                    {/* 删除图片按钮 */}
                    {issue.status !== "已合并" && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImageClick(imageUrl)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {issue.imageUrls.length > 3 && (
                  <div
                    className="relative aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                    onClick={() => openImageDialog(issue.imageUrls[3])}
                  >
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 mx-auto" />
                      <span className="text-xs">+{issue.imageUrls.length - 3}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md bg-muted/50">
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">暂无图片</p>
              </div>
            )}
          </div>

          {/* 添加自动生成文档按钮 */}
          {issue.eventId && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm text-muted-foreground">文档操作</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1"
                        onClick={handleAutoGenerateDoc}
                        disabled={isGeneratingDoc || issue.status === "已合并"}
                      >
                        {isGeneratingDoc ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3" />
                            自动生成文档
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>根据卡片内容自动生成文档</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 显示生成的文档下载链接 */}
              {generatedDocUrl && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <FileDown className="h-4 w-4 text-primary" />
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleDownloadGeneratedDoc}>
                    下载生成的文档
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {showDetails && (
            <div className="mt-2 space-y-3 border-t pt-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(issue.recordTimestamp), "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{issue.reporterName}</span>
                </div>
              </div>

              {/* 原始输入区域 - 添加删除和添加按钮 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium text-sm text-muted-foreground">原始输入</h3>
                  {issue.status !== "已合并" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setManageMessagesDialogOpen(true)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        管理消息
                      </Button>
                    </div>
                  )}
                </div>
                {issue.rawTextInput ? (
                  <p className="text-xs text-muted-foreground">{issue.rawTextInput}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">暂无原始输入</p>
                )}
              </div>

              {/* 显示关联的API文档 */}
              {issue.eventId && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">关联文档</h3>
                  {isLoadingDocs ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      加载文档中...
                    </div>
                  ) : apiDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {apiDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <File className="h-4 w-4 text-primary" />
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs truncate max-w-[200px]"
                            onClick={() => handleDownloadApiDoc(doc.doc_url)}
                          >
                            {extractFileName(doc.doc_url)}
                            <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无关联文档</p>
                  )}
                </div>
              )}

              {relatedDocuments.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">手动生成文档</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedDocuments.map((doc) => (
                      <Badge key={doc.id} variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {doc.documentType} {doc.documentIdentifier}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {issue.mergedFromCardIds && issue.mergedFromCardIds.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">合并自</h3>
                  <div className="flex flex-wrap gap-1">
                    {issue.mergedFromCardIds.map((id) => (
                      <Badge key={id} variant="outline" size="sm">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {issue.mergedIntoCardId && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">已合并至</h3>
                  <Badge variant="outline">{issue.mergedIntoCardId}</Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0 flex justify-center">
        <Button variant="ghost" size="sm" onClick={toggleDetails} className="w-full text-xs">
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> 收起详情
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> 查看详情
            </>
          )}
        </Button>
      </CardFooter>

      {/* 图片查看对话框 */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && closeImageDialog()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image src={selectedImage || "/placeholder.svg"} alt="问题图片" fill className="object-contain" />
              {/* 在大图模式下也添加删除按钮 */}
              {issue.status !== "已合并" && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => {
                    closeImageDialog()
                    handleDeleteImageClick(selectedImage)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除图片
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除图片确认对话框 */}
      <DeleteImageDialog
        isOpen={deleteImageDialogOpen}
        onClose={() => setDeleteImageDialogOpen(false)}
        onConfirm={confirmDeleteImage}
        imageUrl={imageToDelete.url}
        isDeleting={isDeletingImage}
      />

      {/* 删除消息确认对话框 */}
      <DeleteMessageDialog
        isOpen={deleteMessageDialogOpen}
        onClose={() => setDeleteMessageDialogOpen(false)}
        onConfirm={confirmDeleteMessage}
        messageContent={messageToDelete.content}
        isDeleting={isDeletingMessage}
      />

      {/* 添加消息对话框 */}
      <AddMessageDialog
        isOpen={addMessageDialogOpen}
        onClose={() => setAddMessageDialogOpen(false)}
        eventId={issue.eventId}
        onMessageAdded={handleAddMessage}
      />

      {/* 关联图片对话框 */}
      <AssociateImageDialog
        isOpen={associateImageDialogOpen}
        onClose={() => setAssociateImageDialogOpen(false)}
        eventId={issue.eventId}
        onImageAssociated={handleAssociateImage}
      />

      {/* 消息管理对话框 */}
      <ManageMessagesDialog
        isOpen={manageMessagesDialogOpen}
        onClose={() => setManageMessagesDialogOpen(false)}
        eventId={issue.eventId}
        onMessagesUpdated={(updatedMessages) => {
          setMessages(updatedMessages)
          // 更新卡片的原始输入，使用第一条消息的内容
          if (updatedMessages.length > 0) {
            const updatedIssue: IssueCard = {
              ...issue,
              rawTextInput: updatedMessages.map((msg) => msg.content).join("\n\n"),
            }
            if (onIssueUpdate) {
              onIssueUpdate(updatedIssue)
            }
          }
        }}
      />
    </Card>
  )
}
