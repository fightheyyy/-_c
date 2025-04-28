"use client"

import Image from "next/image"
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

interface DeleteImageDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  imageUrl: string
  isDeleting: boolean
}

export function DeleteImageDialog({ isOpen, onClose, onConfirm, imageUrl, isDeleting }: DeleteImageDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除图片</AlertDialogTitle>
          <AlertDialogDescription>您确定要删除此图片吗？此操作无法撤销。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 flex justify-center">
          <div className="relative w-64 h-64 border rounded-md overflow-hidden">
            <Image src={imageUrl || "/placeholder.svg"} alt="要删除的图片" fill className="object-cover" />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              "删除图片"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
