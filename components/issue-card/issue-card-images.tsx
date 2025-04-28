"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ImageIcon, Plus, X, Trash2 } from "lucide-react"
import type { IssueCard } from "@/lib/types"
import { DeleteImageDialog } from "@/components/delete-image-dialog"
import { AssociateImageDialog } from "@/components/associate-image-dialog"
import axios from "axios"

interface IssueCardImagesProps {
  issue: IssueCard
  onIssueUpdate?: (updatedIssue: IssueCard) => void
}

export function IssueCardImages({ issue, onIssueUpdate }: IssueCardImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ url: string; messageId: string | null }>({
    url: "",
    messageId: null,
  })
  const [isDeletingImage, setIsDeletingImage] = useState(false)
  const [associateImageDialogOpen, setAssociateImageDialogOpen] = useState(false)
  const { toast } = useToast()

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const closeImageDialog = () => {
    setSelectedImage(null)
  }

  // Simplified message ID extraction
  const getMessageIdFromImageUrl = (url: string): string | null => {
    // Check for om_ pattern which is the message ID format
    const omMatch = url.match(/om_[a-zA-Z0-9_-]+/)
    if (omMatch) return omMatch[0]

    // Check for API path format
    const apiMatch = url.match(/\/api\/image\/(.+)$/)
    if (apiMatch) {
      const extracted = apiMatch[1]
      return /\.(jpg|jpeg|png|gif)$/i.test(extracted) ? extracted.replace(/\.[^/.]+$/, "") : extracted
    }

    // Extract last part of URL path as fallback
    const parts = url.split("/")
    return parts[parts.length - 1].replace(/\.[^/.]+$/, "") || null
  }

  const handleDeleteImageClick = (imageUrl: string) => {
    const messageId = getMessageIdFromImageUrl(imageUrl)
    if (!messageId) {
      toast({
        title: "无法删除图片",
        description: "无法识别图片ID",
        variant: "destructive",
      })
      return
    }

    setImageToDelete({ url: imageUrl, messageId })
    setDeleteImageDialogOpen(true)
  }

  const confirmDeleteImage = async () => {
    if (!imageToDelete.messageId || !issue.eventId) {
      toast({
        title: "删除失败",
        description: "缺少必要信息",
        variant: "destructive",
      })
      setDeleteImageDialogOpen(false)
      return
    }

    setIsDeletingImage(true)
    try {
      await axios.post("/api/proxy/delete-image", {
        eventId: Number(issue.eventId),
        messageId: imageToDelete.messageId,
      })

      // Update UI
      if (onIssueUpdate) {
        onIssueUpdate({
          ...issue,
          imageUrls: issue.imageUrls.filter((url) => url !== imageToDelete.url),
        })
      }

      toast({ title: "删除成功" })
    } catch (error) {
      toast({
        title: "删除失败",
        variant: "destructive",
      })
    } finally {
      setIsDeletingImage(false)
      setDeleteImageDialogOpen(false)
    }
  }

  const handleAssociateImage = (imageUrl: string) => {
    if (onIssueUpdate) {
      onIssueUpdate({
        ...issue,
        imageUrls: [...issue.imageUrls, imageUrl],
      })
    }
  }

  return (
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

      {/* Image dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && closeImageDialog()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image src={selectedImage || "/placeholder.svg"} alt="问题图片" fill className="object-contain" />
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

      {/* Delete dialog */}
      <DeleteImageDialog
        isOpen={deleteImageDialogOpen}
        onClose={() => setDeleteImageDialogOpen(false)}
        onConfirm={confirmDeleteImage}
        imageUrl={imageToDelete.url}
        isDeleting={isDeletingImage}
      />

      {/* Associate dialog */}
      <AssociateImageDialog
        isOpen={associateImageDialogOpen}
        onClose={() => setAssociateImageDialogOpen(false)}
        eventId={issue.eventId}
        onImageAssociated={handleAssociateImage}
      />
    </div>
  )
}
