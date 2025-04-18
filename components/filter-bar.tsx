"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import type { IssueStatus } from "@/lib/types"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface FilterBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: IssueStatus[]
  setStatusFilter: (statuses: IssueStatus[]) => void
  dateRange: { from: Date | undefined; to: Date | undefined }
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
}: FilterBarProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)

  const statusOptions: { value: IssueStatus; label: string }[] = [
    { value: "待处理", label: "待处理" },
    { value: "整改中", label: "整改中" },
    { value: "待复核", label: "待复核" },
    { value: "已闭环", label: "已闭环" },
    { value: "已合并", label: "已合并" },
  ]

  const toggleStatus = (status: IssueStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((s) => s !== status))
    } else {
      setStatusFilter([...statusFilter, status])
    }
  }

  const clearFilters = () => {
    setStatusFilter([])
    setDateRange({ from: undefined, to: undefined })
    setSearchQuery("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索问题描述、位置、责任单位..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                状态
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-sm px-1">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <div className="p-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center py-1">
                    <Button
                      variant={statusFilter.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => toggleStatus(option.value)}
                    >
                      {option.label}
                    </Button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                日期
                {(dateRange.from || dateRange.to) && (
                  <Badge variant="secondary" className="ml-1 rounded-sm px-1">
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MM-dd")} - ${format(dateRange.to, "MM-dd")}`
                      : dateRange.from
                        ? `从 ${format(dateRange.from, "MM-dd")}`
                        : `至 ${format(dateRange.to, "MM-dd")}`}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }}
                locale={zhCN}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>

          {(statusFilter.length > 0 || dateRange.from || dateRange.to || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
              清除筛选
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
