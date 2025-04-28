"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DocumentGenerationButtonProps {
  selectedCardIds: string[]
}

export function DocumentGenerationButton({ selectedCardIds }: DocumentGenerationButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleGenerateDocument = () => {
    if (selectedCardIds.length === 0) {
      toast({
        title: "未选择卡片",
        description: "请至少选择一张卡片来生成文档",
        variant: "destructive",
      })
      return
    }

    setIsNavigating(true)

    // 将选中的卡片ID作为查询参数传递给文档生成页面
    const queryParams = new URLSearchParams()
    queryParams.set("cards", selectedCardIds.join(","))

    router.push(`/documents/generate?${queryParams.toString()}`)
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleGenerateDocument}
      disabled={selectedCardIds.length === 0 || isNavigating}
      className="flex items-center gap-1"
    >
      {isNavigating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      {isNavigating ? "跳转中..." : "生成文档"}
    </Button>
  )
}
