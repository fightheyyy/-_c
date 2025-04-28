"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { checkApiStatus } from "@/lib/api-client"

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<{
    isAvailable: boolean
    message: string
    timestamp: string
    isChecking: boolean
  }>({
    isAvailable: false,
    message: "未检查",
    timestamp: new Date().toISOString(),
    isChecking: true,
  })

  const checkStatus = async () => {
    setStatus((prev) => ({ ...prev, isChecking: true }))
    try {
      const result = await checkApiStatus()
      setStatus({
        ...result,
        isChecking: false,
      })
    } catch (error) {
      setStatus({
        isAvailable: false,
        message: error instanceof Error ? error.message : "检查失败",
        timestamp: new Date().toISOString(),
        isChecking: false,
      })
    }
  }

  useEffect(() => {
    checkStatus()
    // 每60秒自动检查一次
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={checkStatus} disabled={status.isChecking}>
            {status.isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : status.isAvailable ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-xs">
            <div className="font-medium">API状态</div>
            <div className="text-sm">{status.isAvailable ? "API服务器可用" : "API服务器不可用"}</div>
            <div className="text-xs text-muted-foreground">{status.message}</div>
            <div className="text-xs text-muted-foreground">最后检查: {new Date(status.timestamp).toLocaleString()}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
