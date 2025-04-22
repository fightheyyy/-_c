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
} from "docx"
import type { IssueCard } from "@/lib/types"

// 生成监理通知单Word文档
export async function generateNoticeDocument(
  issue: IssueCard,
  documentId: string,
  generatedByName: string,
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "施工问题通知单",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),

          // 问题标题行
          new Paragraph({
            children: [
              new TextRun({ text: "问题标题：", bold: true }),
              new TextRun({ text: `${issue.location} - 施工问题` }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          // 发现时间行
          new Paragraph({
            children: [
              new TextRun({ text: "发现时间：", bold: true }),
              new TextRun({ text: new Date(issue.recordTimestamp).toLocaleString("zh-CN") }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          // 问题位置行
          new Paragraph({
            children: [new TextRun({ text: "问题位置：", bold: true }), new TextRun({ text: issue.location })],
            spacing: { before: 200, after: 200 },
          }),

          // 责任单位行
          new Paragraph({
            children: [new TextRun({ text: "责任单位：", bold: true }), new TextRun({ text: issue.responsibleParty })],
            spacing: { before: 200, after: 200 },
          }),

          // 问题描述标题
          new Paragraph({
            text: "问题描述：",
            bold: true,
            spacing: { before: 200, after: 100 },
          }),

          // 问题描述内容
          new Paragraph({
            text: issue.description,
            spacing: { before: 100, after: 200 },
          }),

          // 整改措施标题
          new Paragraph({
            text: "整改措施：",
            bold: true,
            spacing: { before: 200, after: 100 },
          }),

          // 整改措施内容
          new Paragraph({
            text: "请按照相关规范和标准要求进行整改，确保施工质量和安全。整改完成后，请及时通知监理进行复核验收。",
            spacing: { before: 100, after: 200 },
          }),

          // 底部信息
          new Paragraph({
            children: [new TextRun({ text: "监理单位：东方明珠监理公司", bold: true })],
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "监理工程师：" + generatedByName, bold: true })],
            spacing: { before: 200, after: 200 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "通知单编号：" + documentId, bold: true })],
            spacing: { before: 200, after: 200 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "签发日期：" + new Date().toLocaleDateString("zh-CN"), bold: true })],
            spacing: { before: 200, after: 200 },
          }),
        ],
      },
    ],
  })

  return await Packer.toBlob(doc)
}

// 生成巡检记录Word文档
export async function generateInspectionRecordDocument(
  issues: IssueCard[],
  documentId: string,
  generatedByName: string,
  conclusion: string,
): Promise<Blob> {
  // 创建问题清单表格
  const issueListRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: "序号", alignment: AlignmentType.CENTER })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: "问题描述", alignment: AlignmentType.CENTER })],
          width: { size: 40, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: "位置", alignment: AlignmentType.CENTER })],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: "责任单位", alignment: AlignmentType.CENTER })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: "状态", alignment: AlignmentType.CENTER })],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...issues.map(
      (issue, index) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
            new TableCell({ children: [new Paragraph({ text: issue.description })] }),
            new TableCell({ children: [new Paragraph({ text: issue.location })] }),
            new TableCell({ children: [new Paragraph({ text: issue.responsibleParty })] }),
            new TableCell({ children: [new Paragraph({ text: issue.status })] }),
          ],
        }),
    ),
  ]

  // 按责任单位分组问题
  const issuesByParty: Record<string, IssueCard[]> = {}
  issues.forEach((issue) => {
    const party = issue.responsibleParty || "未指定责任单位"
    if (!issuesByParty[party]) {
      issuesByParty[party] = []
    }
    issuesByParty[party].push(issue)
  })

  // 创建详细问题描述段落
  const detailedIssuesParagraphs: Paragraph[] = []

  Object.entries(issuesByParty).forEach(([party, partyIssues]) => {
    // 添加责任单位标题
    detailedIssuesParagraphs.push(
      new Paragraph({
        text: `${party} - 问题详情（${partyIssues.length}项）`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 },
      }),
    )

    // 添加每个问题的详细描述
    partyIssues.forEach((issue, index) => {
      detailedIssuesParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `问题 ${index + 1}：`, bold: true }),
            new TextRun({ text: issue.description }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `位置：${issue.location}` })],
          spacing: { before: 100, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `状态：${issue.status}` })],
          spacing: { before: 100, after: 200 },
        }),
      )
    })
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "工程巡检记录",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
          }),

          // 巡检记录编号和日期
          new Paragraph({
            children: [new TextRun({ text: "巡检记录编号：", bold: true }), new TextRun({ text: documentId })],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "日期：", bold: true }),
              new TextRun({ text: new Date().toLocaleDateString("zh-CN") }),
            ],
            spacing: { before: 100, after: 200 },
          }),

          // 巡检概况标题
          new Paragraph({
            text: "巡检概况：",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),

          // 巡检人员
          new Paragraph({
            children: [new TextRun({ text: "巡检人员：", bold: true }), new TextRun({ text: generatedByName })],
            spacing: { before: 100, after: 100 },
          }),

          // 巡检区域
          new Paragraph({
            children: [
              new TextRun({ text: "巡检区域：", bold: true }),
              new TextRun({ text: Array.from(new Set(issues.map((i) => i.location))).join(", ") }),
            ],
            spacing: { before: 100, after: 100 },
          }),

          // 问题总数
          new Paragraph({
            children: [
              new TextRun({ text: "问题总数：", bold: true }),
              new TextRun({ text: issues.length.toString() }),
            ],
            spacing: { before: 100, after: 100 },
          }),

          // 责任单位数
          new Paragraph({
            children: [
              new TextRun({ text: "责任单位：", bold: true }),
              new TextRun({ text: Object.keys(issuesByParty).length.toString() }),
            ],
            spacing: { before: 100, after: 200 },
          }),

          // 问题清单标题
          new Paragraph({
            text: "问题清单：",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          // 问题清单表格
          new Table({
            rows: issueListRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // 问题详情标题
          new Paragraph({
            text: "问题详情：",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          // 详细问题描述
          ...detailedIssuesParagraphs,

          // 巡检结论
          new Paragraph({
            text: "巡检结论：",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          new Paragraph({
            text: conclusion || `本次巡检共发现 ${issues.length} 项问题，请相关责任单位按要求及时整改。`,
            spacing: { before: 100, after: 300 },
          }),

          // 底部信息
          new Paragraph({
            children: [new TextRun({ text: "监理单位：东方明珠监理公司", bold: true })],
            spacing: { before: 300, after: 100 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "监理工程师：" + generatedByName, bold: true })],
            spacing: { before: 100, after: 100 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "日期：" + new Date().toLocaleDateString("zh-CN"), bold: true })],
            spacing: { before: 100, after: 100 },
          }),
        ],
      },
    ],
  })

  return await Packer.toBlob(doc)
}
