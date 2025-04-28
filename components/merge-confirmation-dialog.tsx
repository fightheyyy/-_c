"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface MergeConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedCount: number
  isMerging: boolean
}

export function MergeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isMerging,
}: MergeConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认合并卡片</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要将选中的 {selectedCount}{" "}
            张卡片合并为一张吗？此操作将创建一个新的合并卡片，原卡片将被标记为"已合并"状态。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isMerging}>
            取消
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isMerging} className="flex items-center gap-2">
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                合并中...
              </>
            ) : (
              "确认合并"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
