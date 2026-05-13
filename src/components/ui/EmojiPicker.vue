<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const EMOJIS = [
  { category: 'Mood',         items: ['😊','😔','😢','😡','😰','😴','😎','🤩','😤','🥺'] },
  { category: 'Health',       items: ['💊','💉','🩺','🌡️','🩹','🤧','🤒','💪','🧠','❤️'] },
  { category: 'Activities',   items: ['🏃','🏋️','🚶','🧘','🚴','🏊','📚','🎵','🎮','🛌'] },
  { category: 'Food & Drink', items: ['☕','🍵','💧','🥗','🍎','🥦','🥤','🍕','🍫','🥛'] },
  { category: 'Nature',       items: ['☀️','🌧️','❄️','🌸','🌿','🍀','🌙','⭐'] },
  { category: 'Misc',         items: ['✅','❌','📊','📈','🗓️','⏰','🔴','🟢','🟡','💤'] },
]

const open = ref(false)
const pickerEl = ref<HTMLElement | null>(null)

function select(emoji: string) {
  emit('update:modelValue', emoji)
  open.value = false
}

function onMouseDown(e: MouseEvent) {
  if (open.value && pickerEl.value && !pickerEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onMouseDown))
onUnmounted(() => document.removeEventListener('mousedown', onMouseDown))
</script>

<template>
  <div class="relative" ref="pickerEl">
    <button
      type="button"
      @click="open = !open"
      class="text-2xl w-10 h-10 flex items-center justify-center border border-edge rounded-input bg-surface hover:bg-subtle transition-colors"
      :aria-expanded="open"
    >
      {{ modelValue }}
    </button>

    <div
      v-if="open"
      class="absolute z-50 mt-1 right-0 w-72 bg-raised border border-edge rounded-card shadow-elevated p-3 space-y-2 max-h-72 overflow-y-auto"
    >
      <div v-for="cat in EMOJIS" :key="cat.category">
        <p class="text-xs font-medium text-ink-muted mb-1">{{ cat.category }}</p>
        <div class="flex flex-wrap gap-0.5">
          <button
            v-for="emoji in cat.items"
            :key="emoji"
            type="button"
            @click="select(emoji)"
            class="text-xl w-9 h-9 flex items-center justify-center rounded-input hover:bg-subtle transition-colors"
          >{{ emoji }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
