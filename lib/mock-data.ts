import type { IssueCard, GeneratedDocument } from "./types"

export const mockIssueCards: IssueCard[] = [
  {
    id: "1001", // 修改为数字字符串ID
    originalMessageIds: ["msg1", "msg2", "msg3"],
    reporterUserId: "user123",
    reporterName: "张明",
    recordTimestamp: "2025-04-18T10:25:00Z",
    rawTextInput:
      "我在二期工程B区3楼发现一处安全隐患，钢筋绑扎不符合规范要求。钢筋间距明显超过设计要求，部分位置搭接长度不足，存在施工质量风险。责任单位是中建三局，请尽快整改。",
    imageUrls: [
      "/tangled-rebar-mess.png",
      "/rebar-grid-detail.png",
      "/tangled-rebar-mess.png",
      "/rebar-grid-detail.png",
    ],
    description:
      "[B区3楼] 钢筋绑扎不符合规范要求，钢筋间距明显超过设计规定，部分位置搭接长度不足，存在结构安全隐患。请[中建三局]按照《混凝土结构工程施工规范》GB50666-2011中相关条款要求进行整改。",
    location: "B区3楼",
    responsibleParty: "中建三局",
    status: "已闭环",
    lastUpdatedTimestamp: "2025-04-18T14:31:00Z",
    projectId: "project123",
    isDeleted: false,
    generatedDocumentIds: ["DOC-123456"],
    eventId: 1001, // 保持eventId为数字
  },
  {
    id: "1002", // 修改为数字字符串ID
    originalMessageIds: ["msg4", "msg5"],
    reporterUserId: "user123",
    reporterName: "张明",
    recordTimestamp: "2025-04-18T11:15:00Z",
    rawTextInput: "C区5楼电气线路敷设不规范，电线未穿管保护，存在安全隐患。责任单位是华电安装公司。",
    imageUrls: ["/exposed-wiring-hazard.png", "/exposed-wiring-hazard.png"],
    description:
      "[C区5楼] 电气线路敷设不规范，电线未按设计要求穿管保护，存在安全隐患和火灾风险。请[华电安装公司]立即整改，确保按照《建筑电气工程施工质量验收规范》GB50303-2015的要求进行施工。",
    location: "C区5楼",
    responsibleParty: "华电安装公司",
    status: "整改中",
    lastUpdatedTimestamp: "2025-04-18T13:20:00Z",
    projectId: "project123",
    isDeleted: false,
    eventId: 1002, // 保持eventId为数字
  },
  {
    id: "1003", // 修改为数字字符串ID
    originalMessageIds: ["msg6"],
    reporterUserId: "user456",
    reporterName: "李强",
    recordTimestamp: "2025-04-18T13:45:00Z",
    rawTextInput: "A区地下室防水施工质量不达标，墙面有渗水现象。责任单位是防水专业分包。",
    imageUrls: ["/exposed-foundation-leak.png"],
    description:
      "[A区地下室] 防水施工质量不达标，墙面出现明显渗水现象，防水层施工不符合设计要求。请[防水专业分包]按照《地下防水工程质量验收规范》GB50208-2011的要求进行返工处理。",
    location: "A区地下室",
    responsibleParty: "防水专业分包",
    status: "待处理",
    lastUpdatedTimestamp: "2025-04-18T13:45:00Z",
    projectId: "project123",
    isDeleted: false,
    eventId: 1003, // 保持eventId为数字
  },
  {
    id: "1004", // 修改为数字字符串ID
    originalMessageIds: ["msg7", "msg8"],
    reporterUserId: "user789",
    reporterName: "王工",
    recordTimestamp: "2025-04-18T14:30:00Z",
    rawTextInput: "B区外墙脚手架与墙体拉结点不足，存在安全隐患。请总包单位立即整改加固。",
    imageUrls: ["/precarious-scaffold.png"],
    description:
      "[B区外墙] 脚手架与主体结构拉结点数量不足，不符合安全规范要求，存在安全隐患。请[总包单位]立即按方案要求进行整改加固。",
    location: "B区外墙",
    responsibleParty: "总包单位",
    status: "待复核",
    lastUpdatedTimestamp: "2025-04-18T15:10:00Z",
    projectId: "project123",
    isDeleted: false,
    eventId: 1004, // 保持eventId为数字
  },
  {
    id: "1005", // 修改为数字字符串ID
    originalMessageIds: ["msg9"],
    reporterUserId: "user123",
    reporterName: "张明",
    recordTimestamp: "2025-04-18T15:45:00Z",
    rawTextInput: "D区2楼卫生间给排水管道安装不符合规范，存在渗漏风险。责任单位是水电安装单位。",
    imageUrls: ["/exposed-construction-pipes.png"],
    description:
      "[D区2楼] 卫生间给排水管道安装不符合规范，管道连接处密封不严，存在渗漏风险。请[水电安装单位]按照《建筑给水排水及采暖工程施工质量验收规范》GB50242-2002的要求进行整改。",
    location: "D区2楼",
    responsibleParty: "水电安装单位",
    status: "待处理",
    lastUpdatedTimestamp: "2025-04-18T15:45:00Z",
    projectId: "project123",
    isDeleted: false,
    eventId: 1005, // 保持eventId为数字
  },
]

export const mockDocuments: GeneratedDocument[] = [
  {
    id: "DOC-123456",
    documentType: "通知单",
    generationTimestamp: "2025-04-18T14:35:00Z",
    generatedByUserId: "user123",
    generatedByName: "张明",
    sourceCardIds: ["1001"], // 更新为新的ID格式
    documentUrl: "#",
    documentIdentifier: "SN-20250418-001",
  },
  {
    id: "DOC-234567",
    documentType: "巡检记录",
    generationTimestamp: "2025-04-18T17:00:00Z",
    generatedByUserId: "user123",
    generatedByName: "张明",
    sourceCardIds: ["1001", "1002", "1003", "1004", "1005"], // 更新为新的ID格式
    documentUrl: "#",
    documentIdentifier: "IR-20250418-001",
  },
]
