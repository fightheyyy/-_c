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

  // Optimize the getMessageIdFromImageUrl function to be more efficient
  const getMessageIdFromImageUrl = (url: string): string | null => {
    // First check for om_ pattern which is the message ID format
    const omMatch = url.match(/om_[a-zA-Z0-9_-]+/)
    if (omMatch) return omMatch[0]

    // Check for API path format
    const apiMatch = url.match(/\/api\/image\/(.+)$/)
    if (apiMatch) {
      const extracted = apiMatch[1]
      // Remove file extension if present
      return /\.(jpg|jpeg|png|gif)$/i.test(extracted) ? extracted.replace(/\.[^/.]+$/, "") : extracted
    }

    // Extract last part of URL path as fallback
    const parts = url.split("/")
    const lastPart = parts[parts.length - 1].replace(/\.[^/.]+$/, "")
    return lastPart || null
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

  // Optimize the confirmDeleteImage function to be more efficient
  const confirmDeleteImage = async () => {
    if (!imageToDelete.messageId || !issue.eventId) {
      toast({
        title: "删除失败",
        description: "无法删除此图片，缺少必要信息",
        variant: "destructive",
      })
      setDeleteImageDialogOpen(false)
      return
    }

    setIsDeletingImage(true)

    // Ensure eventId is a number
    const numericEventId = Number(issue.eventId)
    if (isNaN(numericEventId)) {
      toast({
        title: "删除失败",
        description: "事件ID格式无效",
        variant: "destructive",
      })
      setIsDeletingImage(false)
      setDeleteImageDialogOpen(false)
      return
    }

    try {
      await axios.post("/api/proxy/delete-image", {
        eventId: numericEventId,
        messageId: imageToDelete.messageId,
      })

      // Optimistically update UI
      const updatedImageUrls = issue.imageUrls.filter((url) => url !== imageToDelete.url)
      if (onIssueUpdate) {
        onIssueUpdate({
          ...issue,
          imageUrls: updatedImageUrls,
        })
      }

      toast({
        title: "删除成功",
        description: "图片已成功删除",
      })
    } catch (error: any) {
      console.error("删除图片失败:", error)
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

      {/* 关联图片对话框 */}
      <AssociateImageDialog
        isOpen={associateImageDialogOpen}
        onClose={() => setAssociateImageDialogOpen(false)}
        eventId={issue.eventId}
        onImageAssociated={handleAssociateImage}
      />
    </Card>
  )
}
