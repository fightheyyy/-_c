"use client"

import { useState } from "react"
import type { IssueCard, IssueStatus } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateEvent } from "@/lib/api-service"
import { Loader2 } from "lucide-react"

interface EditIssueDialogProps {
  issue: IssueCard
  onClose: () => void
  onSave: (updatedIssue: IssueCard) => void
}

export function EditIssueDialog({ issue, onClose, onSave }: EditIssueDialogProps) {
  const [description, setDescription] = useState(issue.description)
  const [location, setLocation] = useState(issue.location)
  const [responsibleParty, setResponsibleParty] = useState(issue.responsibleParty)
  const [status, setStatus] = useState<IssueStatus>(issue.status)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 从ID中提取事件ID
  const getEventId = (): number | null => {
    if (issue.id.startsWith("EV-")) {
      return Number.parseInt(issue.id.replace("EV-", ""))
    }
    return null
  }

  // 将UI状态转换为API状态码
  const mapStatusToCode = (status: IssueStatus): number => {
    switch (status) {
      case "待处理":
        return 0
      case "整改中":
        return 1
      case "待复核":
        return 2
      case "已闭环":
        return 3
      default:
        return 0
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const eventId = getEventId()

      // 如果是API事件（有有效的eventId），则调用API更新
      if (eventId !== null) {
        // 准备API请求数据
        const apiData = {
          summary: description, // 使用description作为summary
          status: mapStatusToCode(status),
          // 可以根据需要添加category字段
        }

        // 调用API更新事件
        await updateEvent(eventId, apiData)
      }

      // 无论是否为API事件，都更新本地UI
      const updatedIssue: IssueCard = {
        ...issue,
        description,
        location,
        responsibleParty,
        status,
        lastUpdatedTimestamp: new Date().toISOString(),
      }

      onSave(updatedIssue)
    } catch (err) {
      console.error("更新失败:", err)
      setError("更新失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑问题记录</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">问题描述</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">施工部位</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="responsibleParty">责任单位</Label>
            <Input
              id="responsibleParty"
              value={responsibleParty}
              onChange={(e) => setResponsibleParty(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">状态</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="待处理">待处理</SelectItem>
                <SelectItem value="整改中">整改中</SelectItem>
                <SelectItem value="待复核">待复核</SelectItem>
                <SelectItem value="已闭环">已闭环</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
