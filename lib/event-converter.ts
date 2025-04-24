import type { Event, IssueCard, IssueStatus } from "./types"

// 将API返回的事件转换为问题卡片格式
export function convertEventToIssueCard(event: Event): IssueCard {
  // 确定状态
  let status: IssueStatus = "待处理"
  switch (event.status) {
    case "0":
      status = "待处理"
      break
    case "1":
      status = "整改中"
      break
    case "2":
      status = "待复核"
      break
    case "3":
      status = "已闭环"
      break
    default:
      status = "待处理"
  }

  // 如果是合并卡片，则状态为"已合并"
  if (event.is_merged) {
    status = "已合并"
  }

  // 提取位置信息（如果有）
  let location = ""
  const locationRegex = /(\d+号楼|\w区|\d+层|\d+楼)/g
  const allMessages = event.messages.map((msg) => msg.content).join(" ")
  const locationMatches = allMessages.match(locationRegex)
  if (locationMatches && locationMatches.length > 0) {
    location = locationMatches[0]
  }

  // 确定责任单位
  let responsibleParty = ""
  if (event.category === "讨论现场问题" || event.category === "巡检问题") {
    responsibleParty = "施工单位"
  } else if (event.category === "验收" || event.category === "旁站") {
    responsibleParty = "监理单位"
  } else {
    responsibleParty = "未指定"
  }

  // 构建描述
  let description = event.summary
  if (location) {
    description = `[${location}] ${description}`
  }

  // 获取图片URL
  const imageUrls = event.candidate_images.map((img) => img.image_data)

  // 获取原始消息内容
  const rawTextInput = event.messages.map((msg) => msg.content).join("\n")

  return {
    id: `EV-${event.id}`,
    originalMessageIds: event.messages.map((msg) => msg.message_id),
    reporterUserId: event.messages.length > 0 ? event.messages[0].sender_id : "",
    reporterName: "系统用户", // 这里可能需要根据sender_id查询用户名
    recordTimestamp: event.create_time,
    rawTextInput: rawTextInput,
    imageUrls: imageUrls.length > 0 ? imageUrls : ["/exposed-wiring-hazard.png"],
    description: description,
    location: location || "未指定位置",
    responsibleParty: responsibleParty,
    status: status,
    lastUpdatedTimestamp: event.update_time,
    projectId: "project123",
    isDeleted: false,
    isMergedCard: event.is_merged,
  }
}
