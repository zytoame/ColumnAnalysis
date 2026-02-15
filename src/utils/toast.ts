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
  error?: any,
) {
  const backendMessage =
    error?.response?.data?.errorMsg ||
    error?.response?.data?.message ||
    error?.response?.data?.msg;

  const rawMessage =
    backendMessage ||
    error?.message ||
    error?.toString?.();

  const userMessage = (() => {
    const msg = (rawMessage ?? "").toString().trim();
    if (/^request failed with status code\s+\d+$/i.test(msg)) {
      return "请检查筛选条件或稍后重试";
    }
    return msg;
  })();

  toast({
    title: options?.title ?? "操作失败",
    description: options?.description ?? (userMessage || "请稍后重试"),
    variant: "destructive",
    showCopy: false,
  })
}
