"use client"

import { useState } from "react"
import type { IssueCard, GeneratedDocument } from "@/lib/types"
import { IssueCardItem } from "@/components/issue-card-item"
import { EditIssueDialog } from "@/components/edit-issue-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

interface IssueCardListProps {
  issues: IssueCard[]
  onIssueUpdate: (updatedIssue: IssueCard) => void
  onIssueDelete: (issueId: string) => void // Add this line
  selectedIssues: string[]
  onIssueSelect: (issueId: string, selected: boolean) => void
  documents: GeneratedDocument[]
}

export function IssueCardList({
  issues,
  onIssueUpdate,
  onIssueDelete,
  selectedIssues,
  onIssueSelect,
  documents,
}: IssueCardListProps) {
  const [editingIssue, setEditingIssue] = useState<IssueCard | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false) // Add this line
  const [issueToDelete, setIssueToDelete] = useState<IssueCard | null>(null) // Add this line

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

  // Add these new handlers
  const handleDeleteClick = (issue: IssueCard) => {
    setIssueToDelete(issue)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (issueToDelete) {
      onIssueDelete(issueToDelete.id)
      setDeleteConfirmOpen(false)
      setIssueToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setIssueToDelete(null)
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
            onDeleteClick={handleDeleteClick} // Add this line
            isSelected={selectedIssues.includes(issue.id)}
            onSelect={(selected) => onIssueSelect(issue.id, selected)}
            relatedDocuments={documents.filter((doc) => doc.sourceCardIds.includes(issue.id))}
          />
        ))}
      </div>

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
