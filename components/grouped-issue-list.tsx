"use client"

import { useState } from "react"
import type { IssueCard, GeneratedDocument } from "@/lib/types"
import { IssueCardItem } from "@/components/issue-card-item"
import { EditIssueDialog } from "@/components/edit-issue-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface GroupedIssueListProps {
  issues: IssueCard[]
  onIssueUpdate: (updatedIssue: IssueCard) => void
  onIssueDelete: (issueId: string, eventId: number | null) => void
  selectedIssues: string[]
  onIssueSelect: (issueId: string, selected: boolean) => void
  documents: GeneratedDocument[]
}

export function GroupedIssueList({
  issues,
  onIssueUpdate,
  onIssueDelete,
  selectedIssues,
  onIssueSelect,
  documents,
}: GroupedIssueListProps) {
  const [editingIssue, setEditingIssue] = useState<IssueCard | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<IssueCard | null>(null)

  const handleEditClick = (issue: IssueCard) => {
    setEditingIssue(issue)
  }

  const handleEditClose = () => {
    setEditingIssue(null)
  }

  const handleEditSave = (updatedIssue: IssueCard) => {
    onIssueUpdate(updatedIssue)
    setEditingIssue(null)
  }

  // 确保onIssueDelete函数正确传递eventId
  const handleDeleteClick = (issue: IssueCard) => {
    console.log(`GroupedIssueList: 请求删除卡片 ID=${issue.id}, eventId=${issue.eventId}`)
    onIssueDelete(issue.id, issue.eventId || null)
  }

  const handleDeleteConfirm = () => {
    if (issueToDelete) {
      onIssueDelete(issueToDelete.id, issueToDelete.eventId || null)
      setDeleteConfirmOpen(false)
      setIssueToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setIssueToDelete(null)
  }

  const toggleGroup = (responsibleParty: string) => {
    const newExpandedGroups = new Set(expandedGroups)
    if (expandedGroups.has(responsibleParty)) {
      newExpandedGroups.delete(responsibleParty)
    } else {
      newExpandedGroups.add(responsibleParty)
    }
    setExpandedGroups(newExpandedGroups)
  }

  // Group issues by responsible party
  const groupedIssues: Record<string, IssueCard[]> = {}
  issues.forEach((issue) => {
    const responsibleParty = issue.responsibleParty || "未指定责任单位"
    if (!groupedIssues[responsibleParty]) {
      groupedIssues[responsibleParty] = []
    }
    groupedIssues[responsibleParty].push(issue)
  })

  // Calculate stats for each group
  const groupStats = Object.entries(groupedIssues).map(([responsibleParty, groupIssues]) => {
    const totalIssues = groupIssues.length
    const unresolvedIssues = groupIssues.filter(
      (issue) => issue.status !== "已闭环" && issue.status !== "已合并",
    ).length
    const progress = totalIssues > 0 ? ((totalIssues - unresolvedIssues) / totalIssues) * 100 : 100

    return {
      responsibleParty,
      totalIssues,
      unresolvedIssues,
      progress,
    }
  })

  // Sort groups by unresolved issues count (descending)
  groupStats.sort((a, b) => b.unresolvedIssues - a.unresolvedIssues)

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">没有找到问题记录</h3>
        <p className="text-sm text-muted-foreground mt-1">尝试调整筛选条件或清除搜索关键词</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupStats.map(({ responsibleParty, totalIssues, unresolvedIssues, progress }) => (
        <Card key={responsibleParty} className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <Button
              variant="ghost"
              className="flex w-full justify-between p-0 h-auto"
              onClick={() => toggleGroup(responsibleParty)}
            >
              <div className="flex items-center gap-2">
                {expandedGroups.has(responsibleParty) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span className="font-medium text-lg">{responsibleParty}</span>
                <Badge variant="outline" className="ml-2">
                  总计: {totalIssues}
                </Badge>
                {unresolvedIssues > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    未闭环: {unresolvedIssues}
                  </Badge>
                )}
              </div>
            </Button>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>问题解决进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          {expandedGroups.has(responsibleParty) && (
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedIssues[responsibleParty]
                  .sort((a, b) => {
                    // 首先按状态排序：未闭环的排在前面
                    const aResolved = a.status === "已闭环" || a.status === "已合并"
                    const bResolved = b.status === "已闭环" || b.status === "已合并"
                    if (aResolved !== bResolved) return aResolved ? 1 : -1

                    // 然后按时间倒序排列
                    return new Date(b.recordTimestamp).getTime() - new Date(a.recordTimestamp).getTime()
                  })
                  .map((issue) => (
                    <IssueCardItem
                      key={issue.id}
                      issue={issue}
                      onEditClick={handleEditClick}
                      onDeleteClick={handleDeleteClick}
                      isSelected={selectedIssues.includes(issue.id)}
                      onSelect={(selected) => onIssueSelect(issue.id, selected)}
                      relatedDocuments={documents.filter((doc) => doc.sourceCardIds.includes(issue.id))}
                      onIssueUpdate={onIssueUpdate} // 添加这一行，传递更新函数
                    />
                  ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {editingIssue && <EditIssueDialog issue={editingIssue} onClose={handleEditClose} onSave={handleEditSave} />}

      <DeleteConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="确认删除问题记录"
        description={`您确定要删除问题记录 #${issueToDelete?.id || ""} 吗？此操作无法撤销。`}
      />
    </div>
  )
}
