"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { IssueCard } from "@/lib/types"
import { generateNoticeDocument } from "@/lib/document-generator"

interface DocumentPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  issue: IssueCard
  documentId?: string
}

export function DocumentPreviewDialog({ isOpen, onClose, issue, documentId }: DocumentPreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      // 使用文档生成器创建Word文档
      const docBlob = await generateNoticeDocument(
        issue,
        documentId || `SN-${new Date().getTime()}`,
        issue.reporterName,
      )

      // 创建下载链接
      const url = URL.createObjectURL(docBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `监理通知单_${documentId || new Date().getTime()}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      onClose()
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>监理通知单预览</DialogTitle>
        </DialogHeader>

        <div className="border rounded-md p-6 my-4 bg-white">
          <div className="text-center text-2xl font-bold mb-8">施工问题通知单</div>

          <div className="grid grid-cols-[120px_1fr] gap-y-6 gap-x-2">
            <div className="flex items-center text-right">
              <span className="text-red-500 mr-1">*</span>
              <span>问题标题：</span>
            </div>
            <div className="border-b border-gray-300 py-1">
              {issue.description.split("]")[0].replace("[", "")} - 施工问题
            </div>

            <div className="flex items-center text-right">
              <span className="text-red-500 mr-1">*</span>
              <span>发现时间：</span>
            </div>
            <div className="border-b border-gray-300 py-1">
              {format(new Date(issue.recordTimestamp), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
            </div>

            <div className="flex items-center text-right">
              <span className="text-red-500 mr-1">*</span>
              <span>问题位置：</span>
            </div>
            <div className="border-b border-gray-300 py-1">{issue.location}</div>

            <div className="flex items-center text-right">
              <span>责任人：</span>
            </div>
            <div className="border-b border-gray-300 py-1">{issue.responsibleParty}</div>

            <div className="flex items-start text-right pt-2">
              <span className="text-red-500 mr-1">*</span>
              <span>问题描述：</span>
            </div>
            <div className="border border-gray-300 rounded-md p-2 min-h-[100px]">{issue.description}</div>

            <div className="flex items-start text-right pt-2">
              <span className="text-red-500 mr-1">*</span>
              <span>整改措施：</span>
            </div>
            <div className="border border-gray-300 rounded-md p-2 min-h-[100px]">
              请按照相关规范和标准要求进行整改，确保施工质量和安全。整改完成后，请及时通知监理进行复核验收。
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div>
              <div>监理单位：东方明珠监理公司</div>
              <div className="mt-4">监理工程师：{issue.reporterName}</div>
            </div>
            <div className="text-right">
              <div>通知单编号：{documentId || "SN-" + new Date().getTime()}</div>
              <div className="mt-4">签发日期：{currentDate}</div>
            </div>
          </div>

          {issue.imageUrls && issue.imageUrls.length > 0 && (
            <div className="mt-8">
              <div className="font-bold mb-2">现场照片：</div>
              <div className="grid grid-cols-2 gap-4">
                {issue.imageUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="border border-gray-300 p-1">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`现场照片 ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
            <Download className="h-4 w-4" />
            {isDownloading ? "下载中..." : "确认下载"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
