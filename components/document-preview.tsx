"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import Image from "next/image"
import type { DocumentTemplate, DocumentData } from "@/lib/document-templates"

interface DocumentPreviewProps {
  isOpen: boolean
  onClose: () => void
  template: DocumentTemplate
  data: DocumentData
  onDownload: () => void
  isGenerating: boolean
}

export function DocumentPreview({ isOpen, onClose, template, data, onDownload, isGenerating }: DocumentPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownload()
    } catch (error) {
      console.error("下载失败:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return ""
    return format(date, "yyyy-MM-dd", { locale: zhCN })
  }

  // 根据模板ID渲染不同的预览内容
  const renderPreviewContent = () => {
    if (template.id === "patrol-record") {
      return (
        <div className="text-sm">
          <div className="mt-16 grid grid-cols-2">
            <div className="mt-2">工程项目名称: {data.projectName}</div>
            <div className="mt-2 text-right">编号: GD-B-214XXX</div>
          </div>
          <div className="mt-8 grid grid-cols-2">
            <div>巡视的工程部位: {data.inspectionLocation}</div>
            <div>施工单位: {data.issues && data.issues.length > 0 ? data.issues[0].responsibleParty || "" : ""}</div>
          </div>
          <div className="mt-8">
            巡视时间: {formatDate(data.inspectionStartDate)} 至 {formatDate(data.inspectionEndDate)}
          </div>
          <div className="mt-32">
            巡视发现的问题及整改情况:
            <div className="mt-2">
              {data.issues &&
                data.issues.map((issue, index) => (
                  <div key={index} className="mt-1">
                    {index + 1}. {issue.description}
                  </div>
                ))}
              {data.findings && <div className="mt-2">{data.findings}</div>}
            </div>
          </div>
          <div className="mt-32 text-right">
            <div>巡视记录填写人（签名）：{data.inspectorName}</div>
            <div className="mt-2">{formatDate(data.inspectionDate)}</div>
          </div>
        </div>
      )
    } else {
      // 监理通知单模板（样式一和样式二共用相同的预览布局）
      return (
        <div className="text-sm">
          <div className="mt-16 grid grid-cols-2">
            <div className="mt-2">工程项目名称: {data.projectName}</div>
            <div className="mt-2 text-right">编号: GD-B-215XXX</div>
          </div>
          <div className="mt-12">
            <div>
              致：
              {data.recipientName || (data.issues && data.issues.length > 0 ? data.issues[0].responsibleParty : "")}
              （施工项目经理部）
            </div>
            <div className="mt-4">事由：{data.subject}</div>
            <div className="mt-8">
              内容：
              <div className="mt-2">{data.noticeContent}</div>
              <div className="mt-2">
                {data.issues &&
                  data.issues.map((issue, index) => (
                    <div key={index} className="mt-1">
                      {index + 1}. {issue.description}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="mt-32 text-right">
            <div>项目监理机构（项目章）：</div>
            <div className="mt-2">总监理工程师（代表）/专业监理工程师（签名）：{data.supervisorName}</div>
            <div className="mt-2">{formatDate(data.noticeDate)}</div>
          </div>
        </div>
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>文档预览 - {template.name}</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          {template.previewImage ? (
            <div className="relative border rounded-md overflow-hidden">
              <Image
                src={template.previewImage || "/placeholder.svg"}
                alt={`${template.name}预览`}
                width={800}
                height={1000}
                className="w-full h-auto"
              />

              {/* 预览中的动态内容覆盖 */}
              <div className="absolute inset-0 p-8">{renderPreviewContent()}</div>
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-muted/50 text-center">
              <p>无法加载预览图片</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">文档信息</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">模板类型:</span> {template.name}
            </div>
            <div>
              <span className="font-medium">项目名称:</span> {data.projectName}
            </div>
            {data.inspectionLocation && (
              <div>
                <span className="font-medium">巡视位置:</span> {data.inspectionLocation}
              </div>
            )}
            {data.inspectorName && (
              <div>
                <span className="font-medium">填写人:</span> {data.inspectorName}
              </div>
            )}
            {data.supervisorName && (
              <div>
                <span className="font-medium">监理工程师:</span> {data.supervisorName}
              </div>
            )}
            {data.inspectionDate && (
              <div>
                <span className="font-medium">日期:</span> {formatDate(data.inspectionDate)}
              </div>
            )}
            {data.noticeDate && (
              <div>
                <span className="font-medium">通知日期:</span> {formatDate(data.noticeDate)}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">包含的问题卡片:</h3>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2">
              {data.issues && data.issues.length > 0 ? (
                data.issues.map((issue, index) => (
                  <div key={index} className="text-sm mb-2 pb-2 border-b last:border-b-0">
                    <div className="font-medium">{issue.id}</div>
                    <div>{issue.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">未选择问题卡片</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDownloading || isGenerating}>
            取消
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading || isGenerating} className="gap-2">
            {isDownloading || isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isGenerating ? "生成中..." : "下载中..."}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                确认下载
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
