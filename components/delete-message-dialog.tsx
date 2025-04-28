"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface DeleteMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  messageContent: string
  isDeleting: boolean
}

export function DeleteMessageDialog({
  isOpen,
  onClose,
  onConfirm,
  messageContent,
  isDeleting,
}: DeleteMessageDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除消息</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除以下消息吗？此操作无法撤销。
            <div className="mt-2 p-2 bg-muted rounded-md text-sm">{messageContent}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              "确认删除"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
