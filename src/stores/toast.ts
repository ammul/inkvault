import { defineStore } from 'pinia'
import { ref } from 'vue'

interface ToastMessage {
  id: number
  text: string
  timer: ReturnType<typeof setTimeout>
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([])
  let nextId = 0

  function show(text: string, duration = 2000) {
    const id = nextId++
    const timer = setTimeout(() => dismiss(id), duration)
    toasts.value.push({ id, text, timer })
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      clearTimeout(toasts.value[idx].timer)
      toasts.value.splice(idx, 1)
    }
  }

  return { toasts, show, dismiss }
})
