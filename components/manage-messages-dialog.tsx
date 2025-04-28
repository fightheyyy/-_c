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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { Trash } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useEffect, useState } from "react"

const formSchema = z.object({
  message: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

interface ManageMessagesDialogProps {
  eventId?: string
}

export function ManageMessagesDialog({ eventId }: ManageMessagesDialogProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  })

  useEffect(() => {
    fetchMessages()
  }, [eventId])

  const fetchMessages = async () => {
    if (!eventId) return

    setIsLoading(true)
    try {
      // 调用API获取卡片关联的所有消息
      const response = await axios.get(`/api/proxy/get-messages?eventId=${eventId}`)

      if (response.data && Array.isArray(response.data)) {
        setMessages(response.data)
      } else {
        // 如果API返回的不是数组，可能是API结构不同
        console.warn("API返回的消息格式不是预期的数组:", response.data)
        // 尝试从响应中提取消息数组
        if (response.data && response.data.messages) {
          setMessages(response.data.messages)
        } else {
          setMessages([])
        }
      }
    } catch (error) {
      console.error("获取消息失败:", error)
      toast({
        title: "获取消息失败",
        description: "无法获取卡片关联的消息，请稍后再试",
        variant: "destructive",
      })
      // 设置为空数组，避免undefined错误
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Manage Messages</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Manage Messages</AlertDialogTitle>
          <AlertDialogDescription>Here you can manage messages associated with this event.</AlertDialogDescription>
        </AlertDialogHeader>
        <Separator className="my-2" />

        {isLoading ? (
          <div>Loading messages...</div>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <div key={message.id} className="border rounded-md p-4 flex items-center justify-between">
                <span>{message.content}</span>
                <Button variant="destructive" size="icon">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Input placeholder="Add a message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Add Message</Button>
              </form>
            </Form>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
