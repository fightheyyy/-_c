"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FilterBar } from "@/components/filter-bar"
import { useAuth } from "@/lib/auth-provider"
import type { IssueCard, IssueStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { MessageSquare, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { GroupedIssueList } from "@/components/grouped-issue-list"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import debounce from "lodash/debounce"
import { mockIssueCards } from "@/lib/mock-data"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [issueCards, setIssueCards] = useState<IssueCard[]>([])
  const [filteredIssues, setFilteredIssues] = useState<IssueCard[]>([])
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<IssueStatus[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [showChatSimulator, setShowChatSimulator] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<{ id: string; eventId: number | null }>({ id: "", eventId: null })
  const [useMockData] = useState(true) // Always use mock data for now

  // Simplified fetch function
  const fetchIssueCards = useCallback(
    debounce(() => {
      setIsLoading(true)
      try {
        // Always use mock data for now
        setIssueCards(mockIssueCards)
        setFilteredIssues(mockIssueCards)
        setSelectedIssues([])
        toast({
          title: "加载模拟数据成功",
          description: `成功加载 ${mockIssueCards.length} 个模拟问题卡片`,
        })
      } catch (error) {
        console.error("获取问题卡片失败:", error)
        toast({
          title: "获取问题卡片失败",
          description: "无法获取问题卡片数据，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }, 500),
    [toast],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const handleDeleteCard = async (cardId: string) => {
    // Simplified delete function - just update local state
    setIssueCards((prev) => prev.filter((card) => card.id !== cardId))
    setSelectedIssues((prev) => prev.filter((id) => id !== cardId))
    toast({
      title: "删除成功",
      description: `卡片 #${cardId} 已成功删除`,
    })
    setDeleteDialogOpen(false)
  }

  // Component mount effect
  useEffect(() => {
    if (isAuthenticated) {
      fetchIssueCards()
    }
  }, [isAuthenticated, fetchIssueCards])

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
          issue.responsibleParty.toLowerCase().includes(query),
      )
    }

    setFilteredIssues(filtered)
  }, [issueCards, statusFilter, dateRange, searchQuery])

  const handleIssueUpdate = (updatedIssue: IssueCard) => {
    // Update local state
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

  const handleIssueDelete = (issueId: string, eventId: number | null) => {
    // Open confirmation dialog
    setCardToDelete({ id: issueId, eventId })
    setDeleteDialogOpen(true)
  }

  if (!isAuthenticated) {
    return null
  }

  if (showChatSimulator) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">飞书聊天模拟器</h2>
        <p className="mb-4">此功能已暂时禁用以优化部署</p>
        <Button onClick={() => setShowChatSimulator(false)}>返回问题记录</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">问题记录</h1>

        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChatSimulator(true)}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            飞书聊天
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={fetchIssueCards}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新问题卡片"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        <div className="flex justify-between items-center mb-4">
          {selectedIssues.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">已选择 {selectedIssues.length} 张卡片</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedIssues([])}>
                取消选择
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">加载问题卡片中...</span>
          </div>
        ) : filteredIssues.length > 0 ? (
          <GroupedIssueList
            issues={filteredIssues}
            onIssueUpdate={handleIssueUpdate}
            onIssueDelete={handleIssueDelete}
            selectedIssues={selectedIssues}
            onIssueSelect={handleIssueSelect}
            documents={[]}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-medium">暂无问题记录</h3>
            <p className="text-sm text-muted-foreground mt-1">请在飞书聊天中发送消息并点击"自动聚类"按钮生成问题卡片</p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteDialogOpen && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除卡片</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除卡片 #{cardToDelete.id} 及其所有关联内容吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteCard(cardToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
