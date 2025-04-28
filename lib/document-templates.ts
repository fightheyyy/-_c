import type { IssueCard } from "@/lib/types"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from "docx"

// 定义文档模板类型
export type DocumentTemplateType = "patrol-record" | "supervision-notice-template1" | "supervision-notice-template2"

// 定义文档模板接口
export interface DocumentTemplate {
  id: DocumentTemplateType
  name: string
  description: string
  requiredFields: string[]
  generateDocument: (data: DocumentData) => Promise<Blob>
  previewImage?: string
}

// 文档数据接口
export interface DocumentData {
  issues: IssueCard[]
  projectName: string
  inspectionLocation?: string
  inspectionStartDate?: Date
  inspectionEndDate?: Date
  inspectionItems?: string[]
  findings?: string
  improvementSuggestions?: string
  inspectorName?: string
  inspectionDate?: Date
  noticeTitle?: string
  noticeContent?: string
  supervisorName?: string
  noticeDate?: Date
  recipientName?: string
  subject?: string
}

// 创建通用的表格边框样式
const createBorderStyle = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
})

// 格式化日期的通用函数
const formatDateForDoc = (date?: Date) => {
  if (!date) return { year: "", month: "", day: "" }
  return {
    year: date.getFullYear().toString(),
    month: (date.getMonth() + 1).toString().padStart(2, "0"),
    day: date.getDate().toString().padStart(2, "0"),
  }
}

// 生成随机编号的通用函数
const generateRandomNumber = (prefix: string) => {
  return `${prefix}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`
}

// 巡视记录模板
export const patrolRecordTemplate: DocumentTemplate = {
  id: "patrol-record",
  name: "巡视记录",
  description: "用于记录工程巡视情况的标准表格",
  requiredFields: ["projectName", "inspectionLocation", "inspectionStartDate", "inspectionEndDate", "inspectorName"],
  previewImage: "/document-templates/inspection-record.png",

  generateDocument: async (data: DocumentData) => {
    try {
      console.log("开始生成巡视记录文档...")

      const borderStyle = createBorderStyle()
      const startDate = formatDateForDoc(data.inspectionStartDate)
      const endDate = formatDateForDoc(data.inspectionEndDate)
      const signDate = formatDateForDoc(data.inspectionDate || new Date())

      // 创建文档
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // 标题
              new Paragraph({
                text: "巡视记录",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }),

              // 表格
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: borderStyle,
                rows: [
                  // 项目信息行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("工程项目名称:")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph(data.projectName || "")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("编号:")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph(generateRandomNumber("GD-B-214"))],
                      }),
                    ],
                  }),

                  // 巡视工程部位行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("巡视的工程部位")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [new Paragraph(data.inspectionLocation || "")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("施工单位")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph(
                            data.issues && data.issues.length > 0 ? data.issues[0].responsibleParty || "" : "",
                          ),
                        ],
                      }),
                    ],
                  }),

                  // 巡视时间行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("巡视时间")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        columnSpan: 3,
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun(startDate.year),
                              new TextRun(" 年 "),
                              new TextRun(startDate.month),
                              new TextRun(" 月 "),
                              new TextRun(startDate.day),
                              new TextRun(" 日 至 "),
                              new TextRun(endDate.year),
                              new TextRun(" 年 "),
                              new TextRun(endDate.month),
                              new TextRun(" 月 "),
                              new TextRun(endDate.day),
                              new TextRun(" 日"),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),

                  // 巡视内容行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        columnSpan: 4,
                        children: [
                          new Paragraph("巡视内容:"),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "□1. 施工单位是否按工程设计文件、工程建设标准和施工规范进行施工和设计。（专项）施工方案施工。",
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [new TextRun("□2. 使用的工程材料、构配件和设备是否合格。")],
                          }),
                          new Paragraph({
                            children: [new TextRun("□3. 施工场所作业人员、特别是施工现场管理人员及危险作业。")],
                          }),
                          new Paragraph({
                            children: [new TextRun("□4. 特种作业人员是否持证上岗。")],
                          }),
                        ],
                      }),
                    ],
                  }),

                  // 巡视发现问题及整改情况行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        columnSpan: 4,
                        children: [
                          new Paragraph("巡视发现的问题及整改情况:"),
                          ...(data.issues || []).map(
                            (issue, index) =>
                              new Paragraph({
                                children: [new TextRun(`${index + 1}. ${issue.description}`)],
                                spacing: { before: 100, after: 100 },
                              }),
                          ),
                          ...(data.findings ? [new Paragraph(data.findings)] : []),
                        ],
                      }),
                    ],
                  }),

                  // 签名行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        columnSpan: 4,
                        children: [
                          new Paragraph({
                            text: `巡视记录填写人（签名）：${data.inspectorName || ""}`,
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 200 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `${signDate.year} 年 ${signDate.month} 月 ${signDate.day} 日`,
                                alignment: AlignmentType.RIGHT,
                              }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 100 },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // 页脚说明
              new Paragraph({
                text: "注：本表一式二份，项目监理机构和建设单位各一份。",
                spacing: { before: 200 },
                size: 18,
              }),
            ],
          },
        ],
      })

      // 使用docx的Packer.toBlob方法生成Blob
      console.log("开始生成文档Blob...")
      const blob = await Packer.toBlob(doc)
      console.log("文档Blob生成成功:", blob.size, "字节,", blob.type)

      // 确保MIME类型正确
      return new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    } catch (error) {
      console.error("生成文档Blob失败:", error)
      throw error
    }
  },
}

// 监理通知单模板1
export const supervisionNoticeTemplate1: DocumentTemplate = {
  id: "supervision-notice-template1",
  name: "监理通知单 (样式一)",
  description: "用于向施工单位发出监理通知的标准表格",
  requiredFields: ["projectName", "recipientName", "subject", "noticeContent", "supervisorName", "noticeDate"],
  previewImage: "/document-templates/supervision-notice-template1.png",

  generateDocument: async (data: DocumentData) => {
    try {
      console.log("开始生成监理通知单文档(样式一)...")

      const borderStyle = createBorderStyle()
      const noticeDate = formatDateForDoc(data.noticeDate)

      // 创建文档
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // 标题
              new Paragraph({
                text: "监理通知单",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }),

              // 表格
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: borderStyle,
                rows: [
                  // 项目信息行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("工程项目名称:")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph(data.projectName || "")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        children: [new Paragraph("编号:")],
                      }),
                      new TableCell({
                        borders: borderStyle,
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph(generateRandomNumber("GD-B-215"))],
                      }),
                    ],
                  }),

                  // 通知内容行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        columnSpan: 4,
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `致：${data.recipientName || ""}（施工项目经理部）`,
                                bold: true,
                              }),
                            ],
                            spacing: { before: 200, after: 200 },
                          }),
                          new Paragraph({
                            text: "事由：",
                            spacing: { before: 200, after: 100 },
                          }),
                          new Paragraph({
                            text: data.subject || "",
                            spacing: { before: 100, after: 200 },
                          }),
                          new Paragraph({
                            text: "内容：",
                            spacing: { before: 200, after: 100 },
                          }),
                          new Paragraph({
                            text: data.noticeContent || "",
                            spacing: { before: 100, after: 200 },
                          }),
                          ...(data.issues || []).map(
                            (issue, index) =>
                              new Paragraph({
                                children: [new TextRun(`${index + 1}. ${issue.description}`)],
                                spacing: { before: 100, after: 100 },
                              }),
                          ),
                        ],
                      }),
                    ],
                  }),

                  // 签名行
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: borderStyle,
                        columnSpan: 4,
                        children: [
                          new Paragraph({
                            text: `项目监理机构（项目章）：`,
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 200 },
                          }),
                          new Paragraph({
                            text: `总监理工程师（代表）/专业监理工程师（签名）：${data.supervisorName || ""}`,
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 100 },
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `${noticeDate.year} 年 ${noticeDate.month} 月 ${noticeDate.day} 日`,
                                alignment: AlignmentType.RIGHT,
                              }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 100 },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // 页脚说明
              new Paragraph({
                text: "注：本表一式三份，项目监理机构、建设单位、施工单位各一份。",
                spacing: { before: 200 },
                size: 18,
              }),
            ],
          },
        ],
      })

      // 使用docx的Packer.toBlob方法生成Blob
      console.log("开始生成通知单Blob...")
      const blob = await Packer.toBlob(doc)
      console.log("通知单Blob生成成功:", blob.size, "字节,", blob.type)

      // 确保MIME类型正确
      return new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    } catch (error) {
      console.error("生成通知单Blob失败:", error)
      throw error
    }
  },
}

// 监理通知单模板2
export const supervisionNoticeTemplate2: DocumentTemplate = {
  id: "supervision-notice-template2",
  name: "监理通知单 (样式二)",
  description: "用于向施工单位发出监理通知的替代表格样式",
  requiredFields: ["projectName", "recipientName", "subject", "noticeContent", "supervisorName", "noticeDate"],
  previewImage: "/document-templates/supervision-notice-template2.png",

  generateDocument: async (data: DocumentData) => {
    try {
      console.log("开始生成监理通知单文档(样式二)...")

      // 这里复用样式一的生成逻辑，因为两个模板的生成逻辑基本相同
      // 实际项目中，如果两个模板有不同的格式，可以在这里自定义不同的生成逻辑
      return supervisionNoticeTemplate1.generateDocument(data)
    } catch (error) {
      console.error("生成通知单Blob失败:", error)
      throw error
    }
  },
}

// 获取所有可用的模板
export function getAvailableTemplates(): DocumentTemplate[] {
  return [patrolRecordTemplate, supervisionNoticeTemplate1, supervisionNoticeTemplate2]
}

// 根据ID获取模板
export function getTemplateById(id: DocumentTemplateType): DocumentTemplate | undefined {
  switch (id) {
    case "patrol-record":
      return patrolRecordTemplate
    case "supervision-notice-template1":
      return supervisionNoticeTemplate1
    case "supervision-notice-template2":
      return supervisionNoticeTemplate2
    default:
      return undefined
  }
}

// 文档数据验证函数
export const validateDocumentData = (
  template: DocumentTemplate,
  data: DocumentData,
): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = []
  template.requiredFields.forEach((field) => {
    if (!data[field]) {
      missingFields.push(field)
    }
  })
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields,
  }
}
