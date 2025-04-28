export type IssueStatus = "待处理" | "整改中" | "待复核" | "已闭环" | "已合并"

export interface IssueCard {
  id: string
  eventId?: number // 添加这一行
  originalMessageIds?: string[]
  reporterUserId: string
  reporterName: string
  recordTimestamp: string
  rawTextInput: string
  imageUrls: string[]
  description: string
  location: string
  responsibleParty: string
  status: IssueStatus
  lastUpdatedTimestamp: string
  projectId: string
  isDeleted: boolean
  generatedDocumentIds?: string[]
  isMergedCard?: boolean
  mergedFromCardIds?: string[]
  mergedIntoCardId?: string
}

export interface GeneratedDocument {
  id: string
  documentType: "通知单" | "巡检记录"
  generationTimestamp: string
  generatedByUserId: string
  generatedByName: string
  sourceCardIds: string[]
  documentUrl: string
  documentIdentifier: string
}

export interface User {
  username: string
  name: string
}

// 添加API文档类型
export interface ApiDocument {
  id: number
  event_id: number
  doc_url: string
  event_summary: string | null
}
