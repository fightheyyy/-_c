"use client"

import { useState } from "react"
import type { Event } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateEvent } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"

interface EditEventDialogProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onSave: (updatedEvent: Event) => void
}

export function EditEventDialog({ event, isOpen, onClose, onSave }: EditEventDialogProps) {
  const [description, setDescription] = useState(event.description)
  const [location, setLocation] = useState(event.location)
  const [responsibleParty, setResponsibleParty] = useState(event.responsibleParty)
  const [status, setStatus] = useState<string>(event.status)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const updatedEvent = {
        ...event,
        description,
        location,
        responsibleParty,
        status,
        updatedAt: new Date().toISOString(),
      }

      await updateEvent(event.id, updatedEvent)
      onSave(updatedEvent)
      toast({
        title: "保存成功",
        description: "事件已成功更新",
      })
    } catch (error) {
      console.error("更新事件失败:", error)
      toast({
        title: "保存失败",
        description: "更新事件时出现错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Select value={status} onValueChange={(value) => setStatus(value)}>
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
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
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
