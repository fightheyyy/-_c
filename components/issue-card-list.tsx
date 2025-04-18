"use client"

import { useState } from "react"
import type { IssueCard, GeneratedDocument } from "@/lib/types"
import { IssueCardItem } from "@/components/issue-card-item"
import { EditIssueDialog } from "@/components/edit-issue-dialog"

interface IssueCardListProps {
  issues: IssueCard[]
  onIssueUpdate: (updatedIssue: IssueCard) => void
  selectedIssues: string[]
  onIssueSelect: (issueId: string, selected: boolean) => void
  documents: GeneratedDocument[]
}

export function IssueCardList({ issues, onIssueUpdate, selectedIssues, onIssueSelect, documents }: IssueCardListProps) {
  const [editingIssue, setEditingIssue] = useState<IssueCard | null>(null)

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {issues.map((issue) => (
          <IssueCardItem
            key={issue.id}
            issue={issue}
            onEditClick={handleEditClick}
            isSelected={selectedIssues.includes(issue.id)}
            onSelect={(selected) => onIssueSelect(issue.id, selected)}
            relatedDocuments={documents.filter((doc) => doc.sourceCardIds.includes(issue.id))}
          />
        ))}
      </div>

      {editingIssue && <EditIssueDialog issue={editingIssue} onClose={handleEditClose} onSave={handleEditSave} />}
    </div>
  )
}
