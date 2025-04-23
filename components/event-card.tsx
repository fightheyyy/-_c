"use client"

import { useState } from "react"
import type { Event } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Building, Trash2, Edit2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deleteEvent } from "@/lib/api-service"

interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
  isSelected: boolean
  onSelect: (selected: boolean) => void
}

export function EventCard({ event, onEdit, onDelete, isSelected, onSelect }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "待处理":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "整改中":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "已闭环":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "已合并":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteEvent(event.id)
      onDelete(event.id)
      toast({
        title: "删除成功",
        description: "事件已成功删除",
      })
    } catch (error) {
      console.error("删除事件失败:", error)
      toast({
        title: "删除失败",
        description: "删除事件时出现错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <div className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            disabled={event.status === "已合并"}
            id={`select-${event.id}`}
          />
          <Badge className={`${getStatusColor(event.status)}`}>{event.status}</Badge>
          {event.combined && <Badge variant="outline">合并卡片</Badge>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">删除</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(event)} disabled={event.status === "已合并"}>
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">编辑</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">问题描述</h3>
            <p className="text-sm">{event.description}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location || "未指定位置"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{event.responsibleParty || "未指定责任单位"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
