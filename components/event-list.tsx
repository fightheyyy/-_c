"use client"

import { useState, useEffect } from "react"
import type { Event, EventGroup } from "@/lib/types"
import { EventCard } from "@/components/event-card"
import { EditEventDialog } from "@/components/edit-event-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getEventsFromDB } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"

interface EventListProps {
  selectedEvents: string[]
  onEventSelect: (eventId: string, selected: boolean) => void
}

export function EventList({ selectedEvents, onEventSelect }: EventListProps) {
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getEventsFromDB()

      if (data && data.events) {
        // 按责任单位分组事件
        const groupedEvents: Record<string, Event[]> = {}
        data.events.forEach((event: Event) => {
          const party = event.responsibleParty || "未指定责任单位"
          if (!groupedEvents[party]) {
            groupedEvents[party] = []
          }
          groupedEvents[party].push(event)
        })

        // 计算每个组的统计信息
        const groups: EventGroup[] = Object.entries(groupedEvents).map(([party, events]) => {
          const totalCount = events.length
          const unresolvedCount = events.filter(
            (event) => event.status !== "已闭环" && event.status !== "已合并",
          ).length
          const progress = totalCount > 0 ? ((totalCount - unresolvedCount) / totalCount) * 100 : 100

          return {
            responsibleParty: party,
            totalCount,
            unresolvedCount,
            progress,
            events,
          }
        })

        // 按未解决问题数量排序
        groups.sort((a, b) => b.unresolvedCount - a.unresolvedCount)
        setEventGroups(groups)

        // 默认展开第一个组
        if (groups.length > 0) {
          setExpandedGroups(new Set([groups[0].responsibleParty]))
        }
      }
    } catch (err) {
      console.error("获取事件失败:", err)
      setError("获取事件数据失败，请刷新页面重试")
      toast({
        title: "加载失败",
        description: "获取事件数据失败，请刷新页面重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroup = (responsibleParty: string) => {
    const newExpandedGroups = new Set(expandedGroups)
    if (expandedGroups.has(responsibleParty)) {
      newExpandedGroups.delete(responsibleParty)
    } else {
      newExpandedGroups.add(responsibleParty)
    }
    setExpandedGroups(newExpandedGroups)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
  }

  const handleSaveEvent = (updatedEvent: Event) => {
    // 更新本地状态
    const updatedGroups = eventGroups.map((group) => {
      if (group.responsibleParty === updatedEvent.responsibleParty) {
        return {
          ...group,
          events: group.events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)),
        }
      }
      return group
    })
    setEventGroups(updatedGroups)
    setEditingEvent(null)
  }

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      // 更新本地状态
      const updatedGroups = eventGroups.map((group) => ({
        ...group,
        events: group.events.filter((event) => event.id !== eventToDelete),
      }))

      // 重新计算统计信息
      const finalGroups = updatedGroups
        .map((group) => {
          const totalCount = group.events.length
          const unresolvedCount = group.events.filter(
            (event) => event.status !== "已闭环" && event.status !== "已合并",
          ).length
          const progress = totalCount > 0 ? ((totalCount - unresolvedCount) / totalCount) * 100 : 100

          return {
            ...group,
            totalCount,
            unresolvedCount,
            progress,
          }
        })
        .filter((group) => group.events.length > 0) // 移除空组

      setEventGroups(finalGroups)
      setDeleteConfirmOpen(false)
      setEventToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setEventToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium text-destructive">{error}</h3>
        <Button onClick={fetchEvents} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  if (eventGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">没有找到问题记录</h3>
        <p className="text-sm text-muted-foreground mt-1">尝试调整筛选条件或清除搜索关键词</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {eventGroups.map((group) => (
        <Card key={group.responsibleParty} className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <Button
              variant="ghost"
              className="flex w-full justify-between p-0 h-auto"
              onClick={() => toggleGroup(group.responsibleParty)}
            >
              <div className="flex items-center gap-2">
                {expandedGroups.has(group.responsibleParty) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span className="font-medium text-lg">{group.responsibleParty}</span>
                <Badge variant="outline" className="ml-2">
                  总计: {group.totalCount}
                </Badge>
                {group.unresolvedCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    未闭环: {group.unresolvedCount}
                  </Badge>
                )}
              </div>
            </Button>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>问题解决进度</span>
                <span>{Math.round(group.progress)}%</span>
              </div>
              <Progress value={group.progress} className="h-2" />
            </div>
          </CardHeader>

          {expandedGroups.has(group.responsibleParty) && (
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.events
                  .sort((a, b) => {
                    // 首先按状态排序：未闭环的排在前面
                    const aResolved = a.status === "已闭环" || a.status === "已合并"
                    const bResolved = b.status === "已闭环" || b.status === "已合并"
                    if (aResolved !== bResolved) return aResolved ? 1 : -1

                    // 然后按时间倒序排列
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                  })
                  .map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteClick}
                      isSelected={selectedEvents.includes(event.id)}
                      onSelect={(selected) => onEventSelect(event.id, selected)}
                    />
                  ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEvent}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="确认删除问题记录"
        description={`您确定要删除这条问题记录吗？此操作无法撤销。`}
      />
    </div>
  )
}
