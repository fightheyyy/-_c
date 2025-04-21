"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IssueCardList } from "@/components/issue-card-list"
import { DocumentList } from "@/components/document-list"
import { FilterBar } from "@/components/filter-bar"
import { useAuth } from "@/lib/auth-provider"
import { mockIssueCards, mockDocuments } from "@/lib/mock-data"
import type { IssueCard, GeneratedDocument, IssueStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FilePlus, Merge, MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { GroupedIssueList } from "@/components/grouped-issue-list"
import { FeishuChatSimulator } from "@/components/feishu-chat-simulator"
import { DocumentPreviewDialog } from "@/components/document-preview-dialog"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("issues")
  const [issueCards, setIssueCards] = useState<IssueCard[]>(mockIssueCards)
  const [documents, setDocuments] = useState<GeneratedDocument[]>(mockDocuments)
  const [filteredIssues, setFilteredIssues] = useState<IssueCard[]>(mockIssueCards)
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<IssueStatus[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped")
  const [showChatSimulator, setShowChatSimulator] = useState(false)
  const [previewIssue, setPreviewIssue] = useState<{
    isOpen: boolean
    issue: IssueCard | null
    documentType: "notice" | "record"
    documentId: string | null
  }>({
    isOpen: false,
    issue: null,
    documentType: "notice",
    documentId: null,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    let filtered = [...issueCards]

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((issue) => statusFilter.includes(issue.status))
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter((issue) => {
        const issueDate = new Date(issue.recordTimestamp)
        return issueDate >= dateRange.from!
      })
    }

    if (dateRange.to) {
      filtered = filtered.filter((issue) => {
        const issueDate = new Date(issue.recordTimestamp)
        return issueDate <= dateRange.to!
      })
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (issue) =>
          issue.description.toLowerCase().includes(query) ||
          issue.location.toLowerCase().includes(query) ||
          issue.responsibleParty.toLowerCase().includes(query) ||
          issue.rawTextInput.toLowerCase().includes(query),
      )
    }

    setFilteredIssues(filtered)
  }, [issueCards, statusFilter, dateRange, searchQuery])

  const handleIssueUpdate = (updatedIssue: IssueCard) => {
    const updatedIssues = issueCards.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue))
    setIssueCards(updatedIssues)

    toast({
      title: "问题记录已更新",
      description: `问题记录 #${updatedIssue.id} 已成功更新`,
    })
  }

  const handleIssueSelect = (issueId: string, selected: boolean) => {
    if (selected) {
      setSelectedIssues((prev) => [...prev, issueId])
    } else {
      setSelectedIssues((prev) => prev.filter((id) => id !== issueId))
    }
  }

  const handleGenerateDocument = (type: "notice" | "record") => {
    if (selectedIssues.length === 0) {
      toast({
        title: "请选择问题记录",
        description: "请至少选择一个问题记录以生成文档",
        variant: "destructive",
      })
      return
    }

    // For notice, only one issue can be selected
    if (type === "notice" && selectedIssues.length > 1) {
      toast({
        title: "选择过多",
        description: "生成监理通知单只能选择一个问题记录",
        variant: "destructive",
      })
      return
    }

    const documentId =
      type === "notice"
        ? `SN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${documents.filter((d) => d.documentType === "通知单").length + 1}`.padEnd(
            4,
            "0",
          )
        : `IR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${documents.filter((d) => d.documentType === "巡检记录").length + 1}`.padEnd(
            4,
            "0",
          )

    // 直接创建文档，不显示预览
    createDocument(type, documentId)
  }

  const createDocument = (type: "notice" | "record", documentId: string) => {
    const newDocument: GeneratedDocument = {
      id: `DOC-${Date.now().toString().slice(-6)}`,
      documentType: type === "notice" ? "通知单" : "巡检记录",
      generationTimestamp: new Date().toISOString(),
      generatedByUserId: user?.username || "unknown",
      generatedByName: user?.name || "未知用户",
      sourceCardIds: [...selectedIssues],
      documentUrl: "#",
      documentIdentifier: documentId,
    }

    setDocuments((prev) => [newDocument, ...prev])

    // Update issue cards with document reference
    const updatedIssues = issueCards.map((issue) => {
      if (selectedIssues.includes(issue.id)) {
        return {
          ...issue,
          generatedDocumentIds: [...(issue.generatedDocumentIds || []), newDocument.id],
        }
      }
      return issue
    })

    setIssueCards(updatedIssues)
    setSelectedIssues([])

    toast({
      title: "文档已生成",
      description: `${type === "notice" ? "监理通知单" : "巡检记录"} ${documentId} 已成功生成`,
    })

    // Switch to documents tab
    setActiveTab("documents")
  }

  const handlePreviewClose = () => {
    setPreviewIssue({
      isOpen: false,
      issue: null,
      documentType: "notice",
      documentId: null,
    })
  }

  const handleMergeIssues = () => {
    if (selectedIssues.length < 2) {
      toast({
        title: "选择不足",
        description: "请至少选择两个问题记录进行合并",
        variant: "destructive",
      })
      return
    }

    const selectedIssueCards = issueCards.filter((issue) => selectedIssues.includes(issue.id))

    // Create a new merged issue card
    const mergedIssue: IssueCard = {
      id: `IR-MERGED-${Date.now().toString().slice(-6)}`,
      originalMessageIds: selectedIssueCards.flatMap((card) => card.originalMessageIds || []),
      reporterUserId: selectedIssueCards[0].reporterUserId,
      reporterName: selectedIssueCards[0].reporterName,
      recordTimestamp: new Date().toISOString(),
      rawTextInput: selectedIssueCards.map((card) => card.rawTextInput).join("\n\n"),
      imageUrls: selectedIssueCards.flatMap((card) => card.imageUrls),
      description: `[合并问题] ${selectedIssueCards.map((card) => card.description).join("\n")}`,
      location: selectedIssueCards[0].location,
      responsibleParty: selectedIssueCards[0].responsibleParty,
      status: "待处理",
      lastUpdatedTimestamp: new Date().toISOString(),
      projectId: selectedIssueCards[0].projectId,
      isDeleted: false,
      generatedDocumentIds: [],
      isMergedCard: true,
      mergedFromCardIds: selectedIssues,
    }

    // Update original cards to mark as merged
    const updatedIssues = issueCards.map((issue) => {
      if (selectedIssues.includes(issue.id)) {
        return {
          ...issue,
          status: "已合并" as IssueStatus,
          mergedIntoCardId: mergedIssue.id,
          lastUpdatedTimestamp: new Date().toISOString(),
        }
      }
      return issue
    })

    // Add the new merged card
    setIssueCards([mergedIssue, ...updatedIssues])
    setSelectedIssues([])

    toast({
      title: "问题记录已合并",
      description: `已成功将 ${selectedIssues.length} 个问题记录合并为一个新记录`,
    })
  }

  const handleNewIssueCreated = (newIssue: IssueCard) => {
    setIssueCards((prev) => [newIssue, ...prev])
  }

  const handleIssueDelete = (issueId: string) => {
    // Remove the issue from the issues list
    const updatedIssues = issueCards.filter((issue) => issue.id !== issueId)
    setIssueCards(updatedIssues)

    // Remove the issue from selected issues if it was selected
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues((prev) => prev.filter((id) => id !== issueId))
    }

    toast({
      title: "问题记录已删除",
      description: `问题记录 #${issueId} 已成功删除`,
    })
  }

  const handleDocumentDelete = (documentId: string) => {
    // Remove the document from the documents list
    const updatedDocuments = documents.filter((doc) => doc.id !== documentId)
    setDocuments(updatedDocuments)

    // Remove document reference from issue cards
    const updatedIssues = issueCards.map((issue) => {
      if (issue.generatedDocumentIds?.includes(documentId)) {
        return {
          ...issue,
          generatedDocumentIds: issue.generatedDocumentIds.filter((id) => id !== documentId),
        }
      }
      return issue
    })
    setIssueCards(updatedIssues)

    // Find the document to show in the toast message
    const deletedDocument = documents.find((doc) => doc.id === documentId)

    toast({
      title: "文档已删除",
      description: `${deletedDocument?.documentType || "文档"} ${deletedDocument?.documentIdentifier || ""} 已成功删除`,
    })
  }

  if (!isAuthenticated) {
    return null
  }

  if (showChatSimulator) {
    return (
      <FeishuChatSimulator
        onBackToDashboard={() => setShowChatSimulator(false)}
        onNewIssueCreated={handleNewIssueCreated}
        currentUser={user!}
      />
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <TabsList className="mb-4 sm:mb-0">
            <TabsTrigger value="issues">问题记录</TabsTrigger>
            <TabsTrigger value="documents">已生成文档</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChatSimulator(true)}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              模拟飞书聊天
            </Button>

            {activeTab === "issues" && selectedIssues.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleMergeIssues} className="flex items-center gap-1">
                  <Merge className="h-4 w-4" />
                  合并卡片 ({selectedIssues.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateDocument("notice")}
                  className="flex items-center gap-1"
                  disabled={selectedIssues.length !== 1}
                >
                  <FilePlus className="h-4 w-4" />
                  生成通知单
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateDocument("record")}
                  className="flex items-center gap-1"
                >
                  <FilePlus className="h-4 w-4" />
                  生成巡检记录
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="issues" className="space-y-4">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />

          <div className="flex justify-end mb-4">
            <div className="border rounded-md overflow-hidden flex">
              <Button
                variant={viewMode === "grouped" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grouped")}
                className="rounded-none"
              >
                按责任单位分组
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                列表视图
              </Button>
            </div>
          </div>

          {viewMode === "grouped" ? (
            <GroupedIssueList
              issues={filteredIssues}
              onIssueUpdate={handleIssueUpdate}
              onIssueDelete={handleIssueDelete}
              selectedIssues={selectedIssues}
              onIssueSelect={handleIssueSelect}
              documents={documents}
            />
          ) : (
            <IssueCardList
              issues={filteredIssues}
              onIssueUpdate={handleIssueUpdate}
              onIssueDelete={handleIssueDelete}
              selectedIssues={selectedIssues}
              onIssueSelect={handleIssueSelect}
              documents={documents}
            />
          )}
        </TabsContent>

        <TabsContent value="documents">
          <DocumentList documents={documents} issues={issueCards} onDocumentDelete={handleDocumentDelete} />
        </TabsContent>
      </Tabs>

      {previewIssue.isOpen && previewIssue.issue && (
        <DocumentPreviewDialog
          isOpen={previewIssue.isOpen}
          onClose={handlePreviewClose}
          issue={previewIssue.issue}
          documentId={previewIssue.documentId || undefined}
        />
      )}
    </div>
  )
}
