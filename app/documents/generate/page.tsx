"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import type { IssueCard } from "@/lib/types"
import {
  getAvailableTemplates,
  getTemplateById,
  validateDocumentData,
  type DocumentData,
  type DocumentTemplateType,
} from "@/lib/document-templates"
import { DocumentPreview } from "@/components/document-preview"
import axios from "axios"

// 导入下载工具函数和模拟数据
import { safeDownloadFile, createBackupDownloadButton } from "@/lib/download-utils"
import { mockIssueCards } from "@/lib/mock-data"

export default function GenerateDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  // 获取URL参数中的卡片ID列表
  const cardIds = searchParams.get("cards")?.split(",") || []

  // 状态
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateType>("supervision-notice-template1")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCards, setSelectedCards] = useState<IssueCard[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [useMockData, setUseMockData] = useState(true) // 默认使用模拟数据
  const [formData, setFormData] = useState<DocumentData>({
    issues: [],
    projectName: "东方明珠二期工程",
    inspectionLocation: "",
    inspectionStartDate: new Date(),
    inspectionEndDate: new Date(),
    inspectionItems: [],
    findings: "",
    improvementSuggestions: "",
    inspectorName: user?.name || "",
    inspectionDate: new Date(),
    noticeTitle: "",
    noticeContent: "",
    supervisorName: user?.name || "",
    noticeDate: new Date(),
    recipientName: "",
    subject: "",
  })

  // 获取所有可用的模板
  const templates = getAvailableTemplates()
  const currentTemplate = getTemplateById(selectedTemplate)

  // 获取选中的卡片数据
  useEffect(() => {
    const fetchSelectedCards = async () => {
      if (cardIds.length === 0) return

      setIsLoading(true)
      try {
        // 使用模拟数据或API数据
        if (useMockData) {
          console.log("使用模拟数据获取卡片")
          // 从模拟数据中过滤出选中的卡片
          const selected = mockIssueCards.filter((card) => cardIds.includes(card.id))

          if (selected.length === 0) {
            console.warn("在模拟数据中未找到匹配的卡片ID:", cardIds)
            toast({
              title: "未找到卡片",
              description: "在模拟数据中未找到匹配的卡片ID",
              variant: "destructive",
            })
          } else {
            console.log("找到模拟卡片:", selected.length)
            setSelectedCards(selected)
            updateFormDataWithCards(selected)
          }
        } else {
          // 使用API数据
          console.log("从API获取卡片数据，卡片ID:", cardIds)

          // 添加错误处理和超时设置
          const response = await axios.get("/api/events", {
            timeout: 10000, // 10秒超时
          })

          console.log("API响应:", response.status, typeof response.data)

          if (response.data && response.data.events) {
            const allCards = response.data.events
            console.log("获取到的所有卡片:", allCards.length)

            // 过滤出选中的卡片 - 修复ID匹配逻辑
            const selected = allCards
              .filter((event: any) => {
                // 支持多种ID格式匹配
                const eventId = event.id.toString()
                const prefixedId = `IR-${eventId}`
                return cardIds.includes(eventId) || cardIds.includes(prefixedId)
              })
              .map((event: any) => {
                // 提取第一条消息作为原始输入
                const firstMessage = event.messages && event.messages.length > 0 ? event.messages[0].content : ""

                // 提取图片URL
                const imageUrls =
                  event.candidate_images && event.candidate_images.length > 0
                    ? event.candidate_images.map((img: any) => img.image_data || `/api/image/${img.image_key}`)
                    : ["/placeholder.svg?key=event-image"]

                // 从消息中提取位置和责任单位
                let location = ""
                let responsibleParty = ""

                // 尝试从摘要或消息中提取位置
                const locationMatch = event.summary.match(/(\d+号楼|\w区|\w座)/)
                if (locationMatch && locationMatch[1]) {
                  location = locationMatch[1]
                }

                // 责任单位暂时设为默认值，后续可以根据实际数据调整
                responsibleParty = "待指定"

                return {
                  id: event.id.toString(),
                  eventId: event.id,
                  originalMessageIds: event.messages ? event.messages.map((m: any) => m.message_id) : [],
                  reporterUserId: event.messages && event.messages.length > 0 ? event.messages[0].sender_id : "unknown",
                  reporterName: "系统聚类",
                  recordTimestamp: event.create_time || new Date().toISOString(),
                  rawTextInput: firstMessage,
                  imageUrls: imageUrls,
                  description: event.summary || "未提供描述",
                  location: location || "未指定位置",
                  responsibleParty: responsibleParty,
                  status:
                    event.status === "0"
                      ? "待处理"
                      : event.status === "1"
                        ? "整改中"
                        : event.status === "2"
                          ? "待复核"
                          : "已闭环",
                  lastUpdatedTimestamp: event.update_time || new Date().toISOString(),
                  projectId: "project123",
                  isDeleted: false,
                  isMergedCard: event.is_merged || false,
                }
              })

            if (selected.length === 0) {
              console.warn("在API数据中未找到匹配的卡片ID:", cardIds)
              toast({
                title: "未找到卡片",
                description: "在API数据中未找到匹配的卡片ID",
                variant: "destructive",
              })
            } else {
              console.log("找到API卡片:", selected.length)
              setSelectedCards(selected)
              updateFormDataWithCards(selected)
            }
          } else {
            throw new Error("API响应格式不正确")
          }
        }
      } catch (error) {
        console.error("获取卡片数据失败:", error)

        // 使用模拟数据作为备选
        if (!useMockData) {
          console.log("API获取失败，切换到模拟数据")
          setUseMockData(true)

          // 从模拟数据中过滤出选中的卡片
          const selected = mockIssueCards.filter((card) => cardIds.includes(card.id))

          if (selected.length > 0) {
            setSelectedCards(selected)
            updateFormDataWithCards(selected)

            toast({
              title: "已切换到模拟数据",
              description: "API获取失败，已自动切换到模拟数据",
              variant: "warning",
            })
          } else {
            toast({
              title: "获取卡片数据失败",
              description: "无法获取选中的卡片数据，请稍后再试",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "获取卡片数据失败",
            description: "无法获取选中的卡片数据，请稍后再试",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelectedCards()
  }, [cardIds, toast, user?.name, useMockData])

  // 根据卡片更新表单数据
  const updateFormDataWithCards = (cards: IssueCard[]) => {
    if (cards.length === 0) return

    setFormData((prev) => ({
      ...prev,
      issues: cards,
      inspectionLocation: cards[0].location || prev.inspectionLocation,
      recipientName: cards[0].responsibleParty || prev.recipientName,
      subject: `关于${cards[0].location}施工问题的通知`,
      noticeContent: `经监理巡视检查，发现贵单位在${cards[0].location}施工过程中存在以下问题，请按要求进行整改并及时回复。`,
    }))
  }

  // 处理表单字段变化
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 打开预览
  const handlePreview = () => {
    if (!currentTemplate) {
      toast({
        title: "模板错误",
        description: "未找到选中的文档模板",
        variant: "destructive",
      })
      return
    }

    // 验证必填字段
    const { isValid, missingFields } = validateDocumentData(currentTemplate, formData)
    if (!isValid) {
      toast({
        title: "缺少必填字段",
        description: `请填写以下必填字段: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setPreviewOpen(true)
  }

  // 生成文档
  const handleGenerateDocument = async () => {
    if (!currentTemplate) {
      toast({
        title: "模板错误",
        description: "未找到选中的文档模板",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      console.log("开始生成文档，模板:", currentTemplate.id)

      // 生成文档
      const docBlob = await currentTemplate.generateDocument(formData)
      console.log("文档生成成功，大小:", docBlob.size, "字节")

      // 生成文件名
      const timestamp = format(new Date(), "yyyyMMdd_HHmmss", { locale: zhCN })
      const filename = `${currentTemplate.name}_${timestamp}.docx`

      // 使用安全下载函数
      const downloadSuccess = await safeDownloadFile(docBlob, filename)

      if (downloadSuccess) {
        toast({
          title: "文档生成成功",
          description: `${currentTemplate.name}文档已成功生成并开始下载`,
        })
      } else {
        // 如果自动下载失败，创建备用下载按钮
        createBackupDownloadButton(docBlob, filename)

        toast({
          title: "下载可能失败",
          description: "请使用屏幕右上角的备用下载按钮",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("生成文档失败:", error)
      toast({
        title: "生成文档失败",
        description: "无法生成文档，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setPreviewOpen(false)
    }
  }

  // 切换数据源
  const toggleDataSource = () => {
    setUseMockData(!useMockData)
  }

  // 返回上一页
  const handleGoBack = () => {
    router.back()
  }

  // 渲染表单字段
  const renderFormFields = () => {
    // 巡视记录特有字段
    if (selectedTemplate === "patrol-record") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="inspectionLocation">
              巡视的工程部位 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inspectionLocation"
              value={formData.inspectionLocation}
              onChange={(e) => handleInputChange("inspectionLocation", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>
                巡视开始日期 <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.inspectionStartDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.inspectionStartDate ? (
                      format(formData.inspectionStartDate, "yyyy-MM-dd", { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.inspectionStartDate}
                    onSelect={(date) => handleInputChange("inspectionStartDate", date)}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>
                巡视结束日期 <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.inspectionEndDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.inspectionEndDate ? (
                      format(formData.inspectionEndDate, "yyyy-MM-dd", { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.inspectionEndDate}
                    onSelect={(date) => handleInputChange("inspectionEndDate", date)}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="inspectorName">
              巡视记录填写人 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inspectorName"
              value={formData.inspectorName}
              onChange={(e) => handleInputChange("inspectorName", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="findings">巡视发现的问题及整改情况</Label>
            <textarea
              id="findings"
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={formData.findings}
              onChange={(e) => handleInputChange("findings", e.target.value)}
              placeholder="除了选中的卡片内容外，可以在此添加额外的问题描述和整改情况..."
            />
          </div>
        </div>
      )
    } else {
      // 监理通知单特有字段（样式一和样式二共用相同的表单字段）
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipientName">
              接收单位 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipientName"
              value={formData.recipientName}
              onChange={(e) => handleInputChange("recipientName", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="subject">
              事由 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="noticeContent">
              内容 <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="noticeContent"
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={formData.noticeContent}
              onChange={(e) => handleInputChange("noticeContent", e.target.value)}
              placeholder="请输入通知内容..."
            />
          </div>

          <div>
            <Label htmlFor="supervisorName">
              监理工程师 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supervisorName"
              value={formData.supervisorName}
              onChange={(e) => handleInputChange("supervisorName", e.target.value)}
            />
          </div>

          <div>
            <Label>
              通知日期 <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.noticeDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.noticeDate ? (
                    format(formData.noticeDate, "yyyy-MM-dd", { locale: zhCN })
                  ) : (
                    <span>选择日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.noticeDate}
                  onSelect={(date) => handleInputChange("noticeDate", date)}
                  initialFocus
                  locale={zhCN}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">生成文档</h1>

        {/* 添加数据源切换按钮 */}
        <Button variant="outline" size="sm" onClick={toggleDataSource} className="ml-auto">
          {useMockData ? "使用API数据" : "使用模拟数据"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">加载卡片数据中...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 选择模板和卡片 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>选择文档模板</CardTitle>
                <CardDescription>选择要生成的文档类型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-md p-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "ring-2 ring-primary border-primary"
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedTemplate(template.id as DocumentTemplateType)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border ${
                              selectedTemplate === template.id ? "bg-primary border-primary" : "border-gray-400"
                            } flex items-center justify-center`}
                          >
                            {selectedTemplate === template.id && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label className="font-medium">
                            {template.name}
                            <p className="text-sm text-muted-foreground font-normal">{template.description}</p>
                          </Label>
                          {template.previewImage && (
                            <div className="mt-2 border rounded-md overflow-hidden">
                              <Image
                                src={template.previewImage || "/placeholder.svg"}
                                alt={`${template.name}预览`}
                                width={300}
                                height={400}
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>选中的卡片</CardTitle>
                <CardDescription>已选择 {selectedCards.length} 张卡片</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                {selectedCards.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCards.map((card) => (
                      <div key={card.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{card.id}</div>
                        </div>
                        <p className="text-sm mt-1">{card.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{card.location}</span>
                          <span>•</span>
                          <span>{card.responsibleParty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">未选择任何卡片，请返回选择卡片</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧 - 表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{selectedTemplate === "patrol-record" ? "巡视记录表单" : "监理通知单表单"}</CardTitle>
                <CardDescription>
                  填写文档所需的信息，<span className="text-destructive">*</span> 为必填项
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 通用字段 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">
                      工程项目名称 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange("projectName", e.target.value)}
                    />
                  </div>
                </div>

                {/* 根据模板类型渲染不同的表单字段 */}
                {renderFormFields()}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleGoBack}>
                    取消
                  </Button>
                  <Button
                    onClick={handlePreview}
                    disabled={isGenerating}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    预览文档
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 文档预览对话框 */}
      {previewOpen && currentTemplate && (
        <DocumentPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          template={currentTemplate}
          data={formData}
          onDownload={handleGenerateDocument}
          isGenerating={isGenerating}
        />
      )}
    </div>
  )
}
