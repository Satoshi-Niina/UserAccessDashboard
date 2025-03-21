
import * as React from "react"
import type { ToastProps } from "@/components/ui/toast"

type ToastData = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

interface ToastState {
  toasts: ToastData[]
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const memoryState: ToastState = { toasts: [] }
const listeners: ((state: ToastState) => void)[] = []

const genId = () => Math.random().toString(36).slice(2, 9)

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return
  
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  
  toastTimeouts.set(toastId, timeout)
}

type ToastAction = 
  | { type: "ADD_TOAST"; toast: ToastData }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastData> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

const dispatch = (action: ToastAction) => {
  memoryState.toasts = reducer(memoryState, action).toasts
  listeners.forEach((listener) => listener(memoryState))
}

const reducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

function createToast(props: Omit<ToastData, "id">) {
  const id = genId()
  
  const update = (props: Partial<ToastData>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })
  
  return {
    id,
    dismiss,
    update,
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)
  
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])
  
  return {
    ...state,
    toast: createToast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}
