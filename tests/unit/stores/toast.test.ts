import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toast store', () => {
  test('show adds a toast with unique id and correct text', () => {
    const toast = useToastStore()
    toast.show('Hello')
    toast.show('World')
    expect(toast.toasts).toHaveLength(2)
    expect(toast.toasts[0].text).toBe('Hello')
    expect(toast.toasts[1].text).toBe('World')
    expect(toast.toasts[0].id).not.toBe(toast.toasts[1].id)
  })

  test('show auto-dismisses after the default 2000ms', () => {
    const toast = useToastStore()
    toast.show('Temporary')
    expect(toast.toasts).toHaveLength(1)
    vi.advanceTimersByTime(2000)
    expect(toast.toasts).toHaveLength(0)
  })

  test('show auto-dismisses after a custom duration', () => {
    const toast = useToastStore()
    toast.show('Brief', 500)
    vi.advanceTimersByTime(499)
    expect(toast.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toast.toasts).toHaveLength(0)
  })

  test('dismiss removes the toast before the timer fires', () => {
    const toast = useToastStore()
    toast.show('Dismiss me')
    const id = toast.toasts[0].id
    toast.dismiss(id)
    expect(toast.toasts).toHaveLength(0)
    // timer was cleared — advancing time should not throw or add entries
    vi.advanceTimersByTime(2000)
    expect(toast.toasts).toHaveLength(0)
  })

  test('multiple toasts auto-dismiss independently by their own duration', () => {
    const toast = useToastStore()
    toast.show('First', 1000)
    toast.show('Second', 3000)
    vi.advanceTimersByTime(1000)
    expect(toast.toasts).toHaveLength(1)
    expect(toast.toasts[0].text).toBe('Second')
    vi.advanceTimersByTime(2000)
    expect(toast.toasts).toHaveLength(0)
  })
})
