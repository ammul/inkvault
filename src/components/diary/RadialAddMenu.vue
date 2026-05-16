<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

export interface MenuItem {
  id: string
  label: string
  icon: string
  color: string
  action: () => void
}

const props = defineProps<{
  modelValue: boolean
  items: MenuItem[]
  disabled?: boolean
  useEmojis: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const animated = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const RADIAL_CIRCLE_MAX = 10
const RADIAL_R = 96
const OVERFLOW_ROW_Y = 148
const OVERFLOW_ROW_STEP = 56

watch(() => props.modelValue, (val) => {
  if (val) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
    requestAnimationFrame(() => { animated.value = true })
  }
}, { immediate: true })

function close() {
  animated.value = false
  const totalMs = (props.items.length - 1) * 18 + 180
  closeTimer = setTimeout(() => {
    emit('update:modelValue', false)
    closeTimer = null
  }, totalMs)
}

function handleItemClick(item: MenuItem) {
  close()
  item.action()
}

function radialItemStyle(index: number, bgColor: string): Record<string, string> {
  const open = animated.value
  const totalInCircle = Math.min(props.items.length, RADIAL_CIRCLE_MAX)
  let dx: number, dy: number

  if (index < RADIAL_CIRCLE_MAX) {
    const step = (2 * Math.PI) / totalInCircle
    const angle = -Math.PI / 2 + index * step
    dx = Math.round(Math.cos(angle) * RADIAL_R)
    dy = Math.round(Math.sin(angle) * RADIAL_R)
  } else {
    const rowIndex = index - RADIAL_CIRCLE_MAX
    const rowCount = props.items.length - RADIAL_CIRCLE_MAX
    const totalWidth = (rowCount - 1) * OVERFLOW_ROW_STEP
    dx = Math.round(-totalWidth / 2 + rowIndex * OVERFLOW_ROW_STEP)
    dy = OVERFLOW_ROW_Y
  }

  const n = props.items.length
  const style: Record<string, string> = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: open
      ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`
      : `translate(-50%, -50%) scale(0.3)`,
    opacity: open ? '1' : '0',
    transition: open
      ? 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease'
      : 'transform 160ms ease-in, opacity 120ms ease',
    transitionDelay: open ? `${index * 30}ms` : `${(n - 1 - index) * 18}ms`,
    pointerEvents: open ? 'auto' : 'none',
    zIndex: '10',
  }
  if (bgColor) style.backgroundColor = bgColor
  return style
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-[9]"
    @click="close()"
    aria-hidden="true"
  />

  <!-- Menu (fixed, centered) -->
  <div
    class="fixed z-10 w-0 h-0"
    style="left: 50%; top: 50%; transform: translate(-50%, -50%)"
  >
    <button
      v-for="(item, i) in items"
      :key="item.id"
      :disabled="disabled"
      :aria-label="item.label"
      :style="[
        radialItemStyle(i, item.id === '__text__' ? '' : item.color),
        item.id !== '__text__' && !useEmojis
          ? { color: 'white', fontSize: '0.75rem', fontWeight: '700' }
          : {},
      ]"
      @click="handleItemClick(item)"
      class="w-12 h-12 rounded-full flex items-center justify-center text-xl leading-none shadow-card disabled:opacity-50"
      :class="item.id === '__text__' ? 'bg-accent text-on-accent hover:bg-accent-dim' : 'hover:opacity-80'"
    >{{ item.icon }}</button>

    <!-- Close button -->
    <button
      @click="close()"
      :aria-label="t('diary.closeAddMenu')"
      class="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center hover:bg-accent-dim shadow-card z-20 radial-x-btn"
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="3" y1="3" x2="15" y2="15"/>
        <line x1="15" y1="3" x2="3" y2="15"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
@keyframes radial-x-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(-120deg) scale(0.2);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
  }
}

.radial-x-btn {
  animation: radial-x-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
</style>
