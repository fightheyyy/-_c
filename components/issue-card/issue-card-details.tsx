"use client"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { MapPin, Building, Calendar, User } from "lucide-react"
import type { IssueCard } from "@/lib/types"

interface IssueCardDetailsProps {
  issue: IssueCard
}

export function IssueCardDetails({ issue }: IssueCardDetailsProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{issue.location || "未指定位置"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span>{issue.responsibleParty || "未指定责任单位"}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(issue.recordTimestamp), "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{issue.reporterName}</span>
        </div>
      </div>
    </>
  )
}
