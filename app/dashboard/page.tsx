"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IssueCardList } from "@/components/issue-card-list"
import { DocumentList } from "@/components/document-list"
import { FilterBar } from "@/components/filter-bar"
import { useAuth } from "@/lib/auth-provider"
import { mockDocuments } from "@/lib/mock-data"
import type { IssueCard, GeneratedDocument, IssueStatus, Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FilePlus, Merge, MessageSquare, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { GroupedIssueList } from "@/components/grouped-issue-list"
import { FeishuChatSimulator } from "@/components/feishu-chat-simulator"
import { DocumentPreviewDialog } from "@/components/document-preview-dialog"
import { MessagesView } from "@/components/messages-view"
import { convertEventToIssueCard } from "@/lib/event-converter"
// 导入新的deleteEvent函数
import { deleteEvent } from "@/lib/api-service"

// 硬编码的事件数据
const hardcodedEvents = {
  events: [
    {
      category: "讨论现场问题",
      summary: "2号楼发现电缆裸露",
      id: 1,
      is_merged: false,
      create_time: "2025-04-24T10:42:00",
      messages: [
        {
          type: "text",
          content: "2号楼发现电缆裸露，存在触电危险",
          sender_id: "ou_5cfcf740cc1614d2b23776fd564909cc",
          timestamp: "2025-04-24T10:24:16.454000",
          message_id: "om_x100b4fae43c8a0280f15ff128fdce6c",
        },
      ],
      candidate_images: [
        {
          image_key: "img_v3_02ll_e55c64e4-fa80-4055-9760-18b8140d641g",
          sender_id: "ou_5cfcf740cc1614d2b23776fd564909cc",
          timestamp: "2025-04-24T10:24:23.830000",
          image_data: "http://localhost:9000/event-images/img_v3_02ll_e55c64e4-fa80-4055-9760-18b8140d641g.jpg",
          message_id: "om_x100b4fae43b711680eca84b3c07d8ba",
        },
      ],
      status: "0",
      update_time: "2025-04-24T10:42:00",
    },
    {
      category: "其他",
      summary: "讨论JSON输出格式的风险",
      id: 2,
      is_merged: false,
      create_time: "2025-04-24T10:42:00",
      messages: [
        {
          type: "text",
          content: "@_user_1 其实你们这么输出jason格式，总会有风险，毕竟大模型是随机输出，一个字符乱都可能卡住",
          sender_id: "ou_69f46927695e0456e5db3c83bea85008",
          timestamp: "2025-04-22T09:24:19.320000",
          message_id: "om_x100b4f5ab2ff24280f2f688450f60fd",
        },
        {
          type: "text",
          content: "虽然呼叫函数会有函数命中问题，但是比直接输出这么复杂结构的jason可靠很多",
          sender_id: "ou_69f46927695e0456e5db3c83bea85008",
          timestamp: "2025-04-22T09:26:01.606000",
          message_id: "om_x100b4f5b4c5a0c300f29ee6d087c571",
        },
        {
          type: "text",
          content: "回复时间卡片会让他呼叫，比如，叫做时间卡片的函数（ event_card），它的输入参数就是你上述这些字段",
          sender_id: "ou_69f46927695e0456e5db3c83bea85008",
          timestamp: "2025-04-22T09:25:30.903000",
          message_id: "om_x100b4f5b4e6665980f175d7bc303c89",
        },
      ],
      candidate_images: [],
      status: "0",
      update_time: "2025-04-24T10:42:00",
    },
    {
      category: "其他",
      summary: "测试消息",
      id: 3,
      is_merged: false,
      create_time: "2025-04-24T10:42:00",
      messages: [
        {
          type: "text",
          content: "@_user_1 test",
          sender_id: "ou_5cfcf740cc1614d2b23776fd564909cc",
          timestamp: "2025-04-22T14:56:37.669000",
          message_id: "om_x100b4f47949b71c40f210da0188e762",
        },
        {
          type: "text",
          content: "@_user_1 123",
          sender_id: "ou_72eca8d326aeb5da486b68558733fbfd",
          timestamp: "2025-04-22T14:55:19.872000",
          message_id: "om_x100b4f479bb634b80f2c9f5002a8aeb",
        },
      ],
      candidate_images: [],
      status: "0",
      update_time: "2025-04-24T10:42:00",
    },
    {
      category: "其他",
      summary: "分享文档链接",
      id: 4,
      is_merged: false,
      create_time: "2025-04-24T10:42:00",
      messages: [
        {
          type: "text",
          content:
            "https://bailian.console.aliyun.com/?tab=doc#/doc/?type=model&url=https%3A%2F%2Fhelp.aliyun.com%2Fdocument_detail%2F2862208.html",
          sender_id: "ou_69f46927695e0456e5db3c83bea85008",
          timestamp: "2025-04-22T09:39:58.568000",
          message_id: "om_x100b4f5b782860800f27cb1be0be2f7",
        },
        {
          type: "text",
          content: "https://tx36pvo1oww.feishu.cn/docx/MEhkdr0Z5oy5mXxeSVAcKQA8nld?from=from_copylink",
          sender_id: "ou_69f46927695e0456e5db3c83bea85008",
          timestamp: "2025-04-24T09:27:46.283000",
          message_id: "om_x100b4fad77ecb4e00f1cd699f29dadd",
        },
      ],
      candidate_images: [],
      status: "0",
      update_time: "2025-04-24T10:42:00",
    },
    {
      category: "其他",
      summary: "讨论巡检助手的工作流程",
      id: 5,
      is_merged: false,
      create_time: "2025-04-24T10:42:00",
      messages: [
        {
          type: "text",
          content:
            '目前用的prompt是这样\n\nprompt = f"""\n\u003Ccontext\u003E\n你是一个建筑工地巡检助手。在巡检过程中，你会将工地现场发送信息留言中的问题进行聚类与合理按标签分类。\n同时你会考虑聚类准确性，以及合理分类。你会预先规划、使用最少步骤完成任务，并在遇到不确定性时请求澄清。\n\u003C/context\u003E\n\n\u003Cplanning_rules\u003E\n\n你需要从以下巡检留言中：\n\n1. 聚类出多个事件，每个事件卡对应一个或多个留言，其事件卡内容包括：\n    - 一个简洁的 summary；\n    - 所属的原始留言 messages（保留原始字段，如 msg_type, message_content 和 create_time）；\n2. 对每个事件卡进行分类，类别为以下五类之一：\n    - 巡检问题：发现现场隐患或风险点\n    - 验收：施工完成后的检查\n    - 旁站：施工过程中的现场陪同监督\n    - 闭环：对之前问题的处理、确认\n    - 其他：不属于以上类型的其他事项\n\n\u003C/planning_rules\u003E\n\n\u003Cformat_rules\u003E\n请以以下 JSON 格式返回所有事件卡：\n\n[\n  {{\n    "event_id": 1,\n    "summary": "...",\n    "messages": [\n      {{\n        "msg_type": "text",\n        "message_content": {{ "text": "..." }},\n        "create_time": "..."\n      }},\n      ...\n    ],\n    "class": "巡检问题"\n  }},\n  ...\n]\n\u003C/format_rules\u003E\n\n以下是巡检留言信息：\n{chr(10).join(prompt_lines)}\n"""',
          sender_id: "ou_95f74ad6e567d99b8adedb1bcaf127ee",
          timestamp: "2025-04-22T05:33:01.249000",
          message_id: "om_x100b4f5fd61c9ca80f330414ce0f239",
        },
      ],
      candidate_images: [],
      status: "0",
      update_time: "2025-04-24T10:42:00",
    },
  ],
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("issues")
  const [issueCards, setIssueCards] = useState<IssueCard[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>(mockDocuments)
  const [filteredIssues, setFilteredIssues] = useState<IssueCard[]>([])
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<IssueStatus[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped")
  const [showChatSimulator, setShowChatSimulator] = useState(false)
  const [showMessagesView, setShowMessagesView] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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

  // 使用硬编码的事件数据
  useEffect(() => {
    try {
      setIsLoading(true)

      // 使用硬编码的事件数据
      const events = hardcodedEvents.events as Event[]

      if (events && Array.isArray(events)) {
        // 将API事件转换为问题卡片格式
        const convertedIssues = events.map((event) => convertEventToIssueCard(event))
        setIssueCards(convertedIssues)
      } else {
        console.warn("事件数据格式不符合预期")
        setIssueCards([])
      }
    } catch (error) {
      console.error("处理事件数据失败:", error)
      toast({
        title: "处理事件数据失败",
        description: "无法处理事件数据，请稍后重试",
        variant: "destructive",
      })
      setIssueCards([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

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

    // 使用中国时间（北京时间，UTC+8）
    const now = new Date()
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const documentId = chinaTime
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 12) // 格式为：年月日时分秒

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

  // 修改handleIssueDelete函数
  const handleIssueDelete = async (issueId: string) => {
    try {
      // 从issueId中提取event_id（数字部分）
      let eventId: number | null = null
      if (issueId.startsWith("EV-")) {
        eventId = Number.parseInt(issueId.replace("EV-", ""))
      }

      if (eventId !== null) {
        // 调用API删除事件
        await deleteEvent(eventId)

        // 删除成功后更新UI
        const updatedIssues = issueCards.filter((issue) => issue.id !== issueId)
        setIssueCards(updatedIssues)

        // 如果被删除的问题在选中列表中，也要从中移除
        if (selectedIssues.includes(issueId)) {
          setSelectedIssues((prev) => prev.filter((id) => id !== issueId))
        }

        toast({
          title: "问题记录已删除",
          description: `问题记录 #${issueId} 已成功删除`,
        })
      } else {
        // 如果不是API事件（没有有效的eventId），仅从UI中移除
        const updatedIssues = issueCards.filter((issue) => issue.id !== issueId)
        setIssueCards(updatedIssues)

        if (selectedIssues.includes(issueId)) {
          setSelectedIssues((prev) => prev.filter((id) => id !== issueId))
        }

        toast({
          title: "问题记录已删除",
          description: `问题记录 #${issueId} 已成功删除`,
        })
      }
    } catch (error) {
      console.error("删除问题记录失败:", error)
      toast({
        title: "删除失败",
        description: "无法删除问题记录，请稍后重试",
        variant: "destructive",
      })
    }
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

  const handleShowMessages = () => {
    setShowMessagesView(true)
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

  if (showMessagesView) {
    return <MessagesView onBackToDashboard={() => setShowMessagesView(false)} />
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
              AI生成事件卡片
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShowMessages()}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              飞书聊天
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

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>加载事件数据中...</span>
            </div>
          ) : viewMode === "grouped" ? (
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
