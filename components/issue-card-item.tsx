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
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DeleteImageDialog } from "@/components/delete-image-dialog"
import { AssociateImageDialog } from "@/components/associate-image-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageDetailDialog } from "@/components/message-detail-dialog"

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
  // 在组件内部更新状态定义
  const [imageToDelete, setImageToDelete] = useState<{
    url: string
    messageId: string | null
    imageKey: string | null
  }>({
    url: "",
    messageId: null,
    imageKey: null,
  })
  const [isDeletingImage, setIsDeletingImage] = useState(false)
  const [associateImageDialogOpen, setAssociateImageDialogOpen] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null)
  const [apiDocuments, setApiDocuments] = useState<ApiDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const { toast } = useToast()
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

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

    // 尝试从URL中提取om_开头的消息ID
    const omIdMatch = url.match(/om_[a-zA-Z0-9_-]+/)
    if (omIdMatch) {
      console.log("找到om_格式的消息ID:", omIdMatch[0])
      return omIdMatch[0]
    }

    // 如果URL包含image_key参数，尝试提取
    if (url.includes("image_key=")) {
      const params = new URLSearchParams(url.split("?")[1])
      const imageKey = params.get("image_key")
      if (imageKey) {
        console.log("从image_key参数提取到的消息ID:", imageKey)
        return imageKey
      }
    }

    // 如果URL是API路径格式
    const apiPathMatch = url.match(/\/api\/image\/(.+)$/)
    if (apiPathMatch && apiPathMatch[1]) {
      console.log("从API路径提取到的消息ID:", apiPathMatch[1])
      return apiPathMatch[1]
    }

    // 如果是完整URL，尝试提取最后一部分
    if (url.startsWith("http")) {
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split("/")
        const lastPart = pathParts[pathParts.length - 1]

        // 去除可能的文件扩展名
        const cleanId = lastPart.replace(/\.[^/.]+$/, "")
        console.log("从URL路径提取到的可能消息ID:", cleanId)
        return cleanId
      } catch (e) {
        console.error("解析URL失败:", e)
      }
    }

    console.log("无法从URL提取消息ID")
    return null
  }

  const handleDeleteImageClick = (imageUrl: string) => {
    console.log("点击删除图片按钮，图片URL:", imageUrl)

    // 尝试从图片URL中提取消息ID
    let messageId = null
    let imageKey = null

    // 首先检查是否能从URL中提取om_开头的消息ID
    const omIdMatch = imageUrl.match(/om_[a-zA-Z0-9_-]+/)
    if (omIdMatch) {
      messageId = omIdMatch[0]
      console.log("找到om_格式的消息ID:", messageId)
    }

    // 如果URL包含image_key或img_v3等格式，可能是图片键
    const imgKeyMatch = imageUrl.match(/img_v3_[a-zA-Z0-9_-]+/)
    if (imgKeyMatch) {
      imageKey = imgKeyMatch[0]
      console.log("找到img_v3格式的图片键:", imageKey)
    }

    // 如果没有找到消息ID或图片键，尝试从URL路径中提取最后一部分
    if (!messageId && !imageKey) {
      const parts = imageUrl.split("/")
      const lastPart = parts[parts.length - 1].split("?")[0] // 移除查询参数

      // 检查是否是文件名，如果是，去除扩展名
      if (lastPart.includes(".")) {
        imageKey = lastPart.substring(0, lastPart.lastIndexOf("."))
      } else {
        imageKey = lastPart
      }

      console.log("从URL路径提取的图片键:", imageKey)
    }

    // 如果仍然无法提取任何ID，使用整个URL作为最后的尝试
    if (!messageId && !imageKey) {
      imageKey = imageUrl
      console.log("无法提取ID，使用完整URL作为图片键")
    }

    // 如果无法提取任何有用的信息，提示用户
    if (!messageId && !imageKey) {
      toast({
        title: "无法删除图片",
        description: "无法识别图片ID，请联系管理员",
        variant: "destructive",
      })
      return
    }

    // 保存提取的信息
    setImageToDelete({
      url: imageUrl,
      messageId: messageId,
      imageKey: imageKey,
    })
    setDeleteImageDialogOpen(true)
  }

  const confirmDeleteImage = async () => {
    console.log(
      "确认删除图片，事件ID:",
      issue.eventId,
      "消息ID:",
      imageToDelete.messageId,
      "图片键:",
      imageToDelete.imageKey,
    )

    if (!issue.eventId) {
      toast({
        title: "删除失败",
        description: "无法删除此图片，未找到对应的事件ID",
        variant: "destructive",
      })
      setDeleteImageDialogOpen(false)
      return
    }

    // 确保至少有一个ID可用
    if (!imageToDelete.messageId && !imageToDelete.imageKey) {
      toast({
        title: "删除失败",
        description: "无法删除此图片，未找到对应的ID",
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
        imageKey: imageToDelete.imageKey,
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
        console.error("错误响应数据:", error.response.data)
        console.error("错误响应状态:", error.response.status)
        console.error("错误响应头:", error.response.headers)
      } else if (error.request) {
        console.error("请求已发出但无响应:", error.request)
      } else {
        console.error("请求错误:", error.message)
      }

      toast({
        title: "删除失败",
        description: error.response?.data?.error || "无法删除图片，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsDeletingImage(false)
      setDeleteImageDialogOpen(false)
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

  // 添加一个新函数，用于直接删除指定消息ID的图片
  const deleteImageByMessageId = async (messageId: string) => {
    if (!issue.eventId) {
      toast({
        title: "删除失败",
        description: "无法删除此图片，未找到对应的事件ID",
        variant: "destructive",
      })
      return
    }

    setIsDeletingImage(true)

    try {
      // 使用代理API路由
      const response = await axios.post("/api/proxy/delete-image", {
        eventId: issue.eventId,
        messageId: messageId,
      })

      console.log("使用指定消息ID删除图片响应:", response)

      if (response.status === 200) {
        toast({
          title: "删除成功",
          description: `成功删除消息ID为 ${messageId} 的图片`,
        })

        // 这里可以添加刷新图片列表的逻辑
      }
    } catch (error: any) {
      console.error(`删除消息ID为 ${messageId} 的图片失败:`, error)
      toast({
        title: "删除失败",
        description: error.response?.data?.error || "无法删除图片，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsDeletingImage(false)
    }
  }

  // 在组件中添加一个测试按钮，用于直接测试删除功能
  // 可以在调试时使用，正式版本可以移除
  const TestDeleteButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => deleteImageByMessageId("om_x100b4f9bfed66d340f2197bf94e2919")}
      disabled={isDeletingImage}
    >
      {isDeletingImage ? "删除中..." : "测试删除指定ID"}
    </Button>
  )

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

              {issue.rawTextInput && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">原始输入</h3>
                  <p className="text-xs text-muted-foreground">{issue.rawTextInput}</p>
                </div>
              )}

              {/* 添加消息源显示 */}
              {issue.originalMessageIds && issue.originalMessageIds.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    消息源 ({issue.originalMessageIds.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    {issue.originalMessageIds.map((msgId, index) => (
                      <div
                        key={msgId}
                        className="text-xs text-muted-foreground py-1 border-b border-dashed border-gray-200 last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded"
                        onClick={() => setSelectedMessageId(msgId)}
                      >
                        <span className="font-medium">#{index + 1}</span>: {msgId}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
        <TestDeleteButton />
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

      {/* 关联图片对话框 */}
      <AssociateImageDialog
        isOpen={associateImageDialogOpen}
        onClose={() => setAssociateImageDialogOpen(false)}
        eventId={issue.eventId}
        onImageAssociated={handleAssociateImage}
      />

      {/* 在组件底部添加消息详情对话框 */}
      {selectedMessageId && (
        <MessageDetailDialog
          isOpen={!!selectedMessageId}
          onClose={() => setSelectedMessageId(null)}
          messageId={selectedMessageId}
        />
      )}
    </Card>
  )
}
