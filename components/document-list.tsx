"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { GeneratedDocument, IssueCard } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, Search, FileText, FileWarning, ChevronDown, ChevronUp, ExternalLink, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { DocumentPreviewDialog } from "@/components/document-preview-dialog"

interface DocumentListProps {
  documents: GeneratedDocument[]
  issues: IssueCard[]
  onDocumentDelete?: (documentId: string) => void
}

export function DocumentList({ documents, issues, onDocumentDelete }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<GeneratedDocument | null>(null)
  const [previewDocument, setPreviewDocument] = useState<{
    isOpen: boolean
    document: GeneratedDocument | null
    issue: IssueCard | null
  }>({
    isOpen: false,
    document: null,
    issue: null,
  })

  const toggleRowExpand = (documentId: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (expandedRows.has(documentId)) {
      newExpandedRows.delete(documentId)
    } else {
      newExpandedRows.add(documentId)
    }
    setExpandedRows(newExpandedRows)
  }

  const filteredDocuments = documents.filter((doc) => {
    // Apply type filter
    if (typeFilter !== "all" && doc.documentType !== typeFilter) {
      return false
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        doc.documentIdentifier.toLowerCase().includes(query) ||
        doc.documentType.toLowerCase().includes(query) ||
        doc.generatedByName.toLowerCase().includes(query)
      )
    }

    return true
  })

  const getIssuesByIds = (ids: string[]) => {
    return issues.filter((issue) => ids.includes(issue.id))
  }

  const handleDeleteClick = (document: GeneratedDocument) => {
    setDocumentToDelete(document)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete && onDocumentDelete) {
      onDocumentDelete(documentToDelete.id)
      setDeleteConfirmOpen(false)
      setDocumentToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setDocumentToDelete(null)
  }

  const handleDownloadClick = (document: GeneratedDocument) => {
    // 对于通知单类型的文档，显示预览对话框
    if (document.documentType === "通知单" && document.sourceCardIds.length > 0) {
      const issueId = document.sourceCardIds[0]
      const issue = issues.find((i) => i.id === issueId)

      if (issue) {
        setPreviewDocument({
          isOpen: true,
          document,
          issue,
        })
      }
    } else {
      // 对于其他类型的文档，直接下载
      console.log("Downloading document:", document.documentIdentifier)
      // 这里可以添加其他类型文档的下载逻辑
    }
  }

  const handleClosePreview = () => {
    setPreviewDocument({
      isOpen: false,
      document: null,
      issue: null,
    })
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">暂无生成文档</h3>
        <p className="text-sm text-muted-foreground mt-1">在问题记录页面选择卡片并生成文档</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索文档编号、类型..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="文档类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有类型</SelectItem>
            <SelectItem value="通知单">监理通知单</SelectItem>
            <SelectItem value="巡检记录">巡检记录</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>文档编号</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>生成时间</TableHead>
              <TableHead>生成人</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  没有找到符合条件的文档
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((document) => (
                <>
                  <TableRow key={document.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleRowExpand(document.id)}>
                        {expandedRows.has(document.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{document.documentIdentifier}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {document.documentType === "通知单" ? (
                          <FileWarning className="h-3 w-3 mr-1" />
                        ) : (
                          <FileText className="h-3 w-3 mr-1" />
                        )}
                        {document.documentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(document.generationTimestamp), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </TableCell>
                    <TableCell>{document.generatedByName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => handleDownloadClick(document)}
                        >
                          <Download className="h-3 w-3" />
                          下载
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(document)}
                        >
                          <Trash2 className="h-3 w-3" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(document.id) && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/50 p-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">关联问题记录</h4>
                          <div className="grid gap-2">
                            {getIssuesByIds(document.sourceCardIds).map((issue) => (
                              <div
                                key={issue.id}
                                className="flex justify-between items-center p-2 rounded-md border bg-background"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="h-5">{issue.status}</Badge>
                                    <span className="text-sm font-medium">{issue.id}</span>
                                  </div>
                                  <p className="text-sm mt-1">{issue.description}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  查看
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="确认删除文档"
        description={`您确定要删除${documentToDelete?.documentType || ""}${documentToDelete?.documentIdentifier || ""}吗？此操作无法撤销。`}
      />

      {previewDocument.isOpen && previewDocument.document && previewDocument.issue && (
        <DocumentPreviewDialog
          isOpen={previewDocument.isOpen}
          onClose={handleClosePreview}
          issue={previewDocument.issue}
          documentId={previewDocument.document.documentIdentifier}
        />
      )}
    </div>
  )
}
