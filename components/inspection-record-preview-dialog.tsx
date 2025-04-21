"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { IssueCard } from "@/lib/types"

interface InspectionRecordPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  issues: IssueCard[]
  documentId?: string
  generatedByName?: string
}

export function InspectionRecordPreviewDialog({
  isOpen,
  onClose,
  issues,
  documentId,
  generatedByName,
}: InspectionRecordPreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editableData, setEditableData] = useState({
    conclusion: "本次巡检共发现 " + issues.length + " 项问题，请相关责任单位按要求及时整改。",
    issueDescriptions: issues.map((issue) => issue.description),
  })

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      // 在实际应用中，这里会调用API生成Word文档
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 模拟下载
      const link = document.createElement("a")
      link.href = "#"
      link.download = `巡检记录_${documentId || new Date().getTime()}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      onClose()
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const toggleEditMode = () => {
    if (!isEditing) {
      // 进入编辑模式时，初始化可编辑内容
      setEditableData({
        conclusion: "本次巡检共发现 " + issues.length + " 项问题，请相关责任单位按要求及时整改。",
        issueDescriptions: issues.map((issue) => issue.description),
      })
    }
    setIsEditing(!isEditing)
  }

  const handleConclusionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableData((prev) => ({
      ...prev,
      conclusion: e.target.value,
    }))
  }

  const handleIssueDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...editableData.issueDescriptions]
    newDescriptions[index] = value
    setEditableData((prev) => ({
      ...prev,
      issueDescriptions: newDescriptions,
    }))
  }

  const currentDate = format(new Date(), "yyyy-MM-dd", { locale: zhCN })

  // 计算各种状态的问题数量
  const statusCounts = issues.reduce(
    (acc, issue) => {
      const status = issue.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // 按责任单位分组问题
  const issuesByParty = issues.reduce(
    (acc, issue) => {
      const party = issue.responsibleParty || "未指定责任单位"
      if (!acc[party]) {
        acc[party] = []
      }
      acc[party].push(issue)
      return acc
    },
    {} as Record<string, IssueCard[]>,
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>巡检记录预览</DialogTitle>
        </DialogHeader>

        <div className="border rounded-md p-6 my-4 bg-white">
          <div className="text-center text-2xl font-bold mb-8">工程巡检记录</div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="font-medium">巡检记录编号：</span>
              <span>{documentId || "IR-" + new Date().getTime()}</span>
            </div>
            <div className="text-right">
              <span className="font-medium">日期：</span>
              <span>{currentDate}</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="font-medium mb-2">巡检概况：</div>
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">巡检人员：</span>
                  <span>{generatedByName || "未指定"}</span>
                </div>
                <div>
                  <span className="font-medium">巡检区域：</span>
                  <span>{Array.from(new Set(issues.map((i) => i.location))).join(", ")}</span>
                </div>
                <div>
                  <span className="font-medium">问题总数：</span>
                  <span>{issues.length}</span>
                </div>
                <div>
                  <span className="font-medium">责任单位：</span>
                  <span>{Object.keys(issuesByParty).length}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="font-medium mb-2">问题状态统计：</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <Badge key={status} variant="outline" className="px-3 py-1">
                      {status}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="font-medium mb-2">问题清单：</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">序号</TableHead>
                  <TableHead>问题描述</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>责任单位</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue, index) => (
                  <TableRow key={issue.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <textarea
                          className="w-full border border-gray-300 rounded-md p-1 text-sm"
                          rows={2}
                          value={editableData.issueDescriptions[index]}
                          onChange={(e) => handleIssueDescriptionChange(index, e.target.value)}
                        />
                      ) : (
                        editableData.issueDescriptions[index] || issue.description
                      )}
                    </TableCell>
                    <TableCell>{issue.location}</TableCell>
                    <TableCell>{issue.responsibleParty}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {Object.entries(issuesByParty).map(([party, partyIssues]) => (
            <div key={party} className="mb-8">
              <div className="font-medium border-b pb-2 mb-4">
                {party} - 问题详情（{partyIssues.length}项）
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {partyIssues.map((issue, index) => {
                  // 找到当前问题在整体issues数组中的索引
                  const issueIndex = issues.findIndex((i) => i.id === issue.id)

                  return (
                    <div key={issue.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">问题 {index + 1}</div>
                        <Badge>{issue.status}</Badge>
                      </div>
                      {isEditing && issueIndex !== -1 ? (
                        <textarea
                          className="w-full border border-gray-300 rounded-md p-1 text-sm mb-2"
                          rows={3}
                          value={editableData.issueDescriptions[issueIndex]}
                          onChange={(e) => handleIssueDescriptionChange(issueIndex, e.target.value)}
                        />
                      ) : (
                        <div className="text-sm mb-2">
                          {issueIndex !== -1 ? editableData.issueDescriptions[issueIndex] : issue.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mb-2">位置：{issue.location}</div>

                      {issue.imageUrls && issue.imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {issue.imageUrls.slice(0, 2).map((url, imgIndex) => (
                            <div key={imgIndex} className="border border-gray-300 p-1">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`现场照片 ${imgIndex + 1}`}
                                className="w-full h-24 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div>
              <div className="font-medium">巡检结论：</div>
              {isEditing ? (
                <textarea
                  className="mt-2 w-full border border-gray-300 rounded-md p-2"
                  rows={3}
                  value={editableData.conclusion}
                  onChange={handleConclusionChange}
                />
              ) : (
                <div className="mt-2 border-b border-gray-300 py-1">
                  {editableData.conclusion || `本次巡检共发现 ${issues.length} 项问题，请相关责任单位按要求及时整改。`}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-medium">监理单位：东方明珠监理公司</div>
              <div className="mt-4">监理工程师：{generatedByName || "未指定"}</div>
              <div className="mt-2">日期：{currentDate}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant="outline" onClick={toggleEditMode} className="gap-2">
            {isEditing ? "完成编辑" : "编辑内容"}
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
