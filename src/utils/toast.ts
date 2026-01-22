import type { ReactNode } from "react"

type ToastFn = (props: {
  title?: ReactNode
  description?: ReactNode
  variant?: "default" | "destructive"
  showCopy?: boolean
}) => unknown

export function showErrorToast(
  toast: ToastFn,
  options?: {
    title?: ReactNode
    description?: ReactNode
  },
) {
  toast({
    title: options?.title ?? "操作失败",
    description: options?.description ?? "请稍后重试",
    variant: "destructive",
    showCopy: false,
  })
}
