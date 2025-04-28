"use client"

import { useState } from "react"
import axios from "axios"
import type { IssueCard, IssueStatus } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

// 状态映射函数：将前端状态映射到API状态码
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
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    // 如果没有eventId，使用本地更新
    if (!issue.eventId) {
      const updatedIssue: IssueCard = {
        ...issue,
        description,
        location,
        responsibleParty,
        status,
        lastUpdatedTimestamp: new Date().toISOString(),
      }
      onSave(updatedIssue)
      return
    }

    // 否则，调用API更新
    setIsSaving(true)
    try {
      // 调用API更新卡片
      await axios.put(`/api/events/${issue.eventId}`, {
        summary: description,
        status: mapStatusToCode(status),
      })

      // 更新本地状态
      const updatedIssue: IssueCard = {
        ...issue,
        description,
        location,
        responsibleParty,
        status,
        lastUpdatedTimestamp: new Date().toISOString(),
      }

      onSave(updatedIssue)

      toast({
        title: "更新成功",
        description: "卡片内容已成功更新",
      })
    } catch (error) {
      console.error("更新卡片失败:", error)
      toast({
        title: "更新失败",
        description: "无法更新卡片内容，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
