<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  noteHtmlToPlainText,
  notePlainTextToHtml,
  sanitizeNoteHtml,
} from '../modules/board/board.notes.rich'

type InlineCommand = 'bold' | 'italic' | 'underline' | 'strikeThrough'

type CommandState = Record<InlineCommand | 'insertUnorderedList' | 'insertOrderedList', boolean>

const props = defineProps<{
  initialHtml: string
  ariaLabel: string
}>()

const emit = defineEmits<{
  change: [payload: { html: string; text: string }]
}>()

const NOTE_COLORS = [
  { label: '默认', value: '#2b3430' },
  { label: '陶红', value: '#b6533c' },
  { label: '琥珀', value: '#a87424' },
  { label: '松绿', value: '#4f765a' },
  { label: '雾蓝', value: '#3f6c8e' },
  { label: '梅紫', value: '#875b80' },
] as const

const editor = ref<HTMLElement | null>(null)
const activeCommands = ref<CommandState>({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
})
let savedRange: Range | null = null

function selectionInsideEditor() {
  const editorElement = editor.value
  const selection = window.getSelection()

  if (!editorElement || !selection || selection.rangeCount === 0) {
    return false
  }

  const anchor = selection.anchorNode
  return Boolean(anchor && editorElement.contains(anchor))
}

function rememberSelection() {
  if (!selectionInsideEditor()) return

  const selection = window.getSelection()
  if (selection?.rangeCount) {
    savedRange = selection.getRangeAt(0).cloneRange()
  }
}

function restoreSelection() {
  const editorElement = editor.value
  if (!editorElement || !savedRange) return

  if (!editorElement.contains(savedRange.commonAncestorContainer)) {
    savedRange = null
    return
  }

  const selection = window.getSelection()
  if (!selection) return

  selection.removeAllRanges()
  selection.addRange(savedRange)
}

function refreshToolbarState() {
  if (!selectionInsideEditor()) return

  try {
    activeCommands.value = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    }
  } catch {
    // queryCommandState 在个别浏览器/选择场景会抛错，保持上一次状态即可。
  }

  rememberSelection()
}

function emitChange() {
  const editorElement = editor.value
  if (!editorElement) return

  const html = editorElement.innerHTML
  emit('change', {
    html,
    text: noteHtmlToPlainText(html),
  })
}

function focusEditor() {
  const editorElement = editor.value
  if (!editorElement) return false

  editorElement.focus({ preventScroll: true })
  restoreSelection()
  return true
}

function runCommand(command: InlineCommand | 'insertUnorderedList' | 'insertOrderedList' | 'removeFormat') {
  if (!focusEditor()) return

  document.execCommand(command, false)
  rememberSelection()
  refreshToolbarState()
  emitChange()
}

function applyColor(color: string) {
  if (!focusEditor()) return

  // styleWithCSS 让 Chrome / WebKit 尽量生成 span[style] 而不是 font[color]；
  // 即便某个 WebKit 版本仍生成 font，白名单也会把它转换回 span[style]。
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand('foreColor', false, color)
  document.execCommand('styleWithCSS', false, 'false')

  rememberSelection()
  refreshToolbarState()
  emitChange()
}

function handlePaste(event: ClipboardEvent) {
  const clipboard = event.clipboardData
  const editorElement = editor.value
  if (!clipboard || !editorElement) return

  event.preventDefault()

  const pastedHtml = clipboard.getData('text/html')
  const pastedText = clipboard.getData('text/plain')
  const safeHtml = pastedHtml ? sanitizeNoteHtml(pastedHtml) : ''
  const insertHtml = safeHtml || notePlainTextToHtml(pastedText)

  if (insertHtml) {
    document.execCommand('insertHTML', false, insertHtml)
  } else if (pastedText) {
    document.execCommand('insertText', false, pastedText)
  }

  rememberSelection()
  emitChange()
}

function handleToolbarPointerDown(event: PointerEvent) {
  // 鼠标点击时保住输入框里的选择。
  // 触屏不拦截：iOS 上拦截 pointerdown 有让后续 click 不触发的风险；
  // 触屏走 savedRange，点完按钮后 focusEditor() 会把选区放回去。
  if (event.pointerType === 'mouse') {
    event.preventDefault()
  }
}

function handleToolbarClick(action: () => void) {
  action()
}

onMounted(() => {
  const editorElement = editor.value
  if (editorElement) {
    editorElement.innerHTML = sanitizeNoteHtml(props.initialHtml)
  }

  document.addEventListener('selectionchange', refreshToolbarState)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', refreshToolbarState)
})
</script>

<template>
  <div class="note-rich-editor">
    <div class="note-rich-toolbar" role="toolbar" :aria-label="`${ariaLabel}格式`">
      <div class="note-rich-toolbar-group">
        <button
          type="button"
          class="note-rich-tool"
          :class="{ 'is-active': activeCommands.bold }"
          :aria-label="`${ariaLabel}加粗`"
          :aria-pressed="activeCommands.bold"
          title="加粗"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('bold'))"
        >B</button>
        <button
          type="button"
          class="note-rich-tool is-italic"
          :class="{ 'is-active': activeCommands.italic }"
          :aria-label="`${ariaLabel}斜体`"
          :aria-pressed="activeCommands.italic"
          title="斜体"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('italic'))"
        >I</button>
        <button
          type="button"
          class="note-rich-tool is-underline"
          :class="{ 'is-active': activeCommands.underline }"
          :aria-label="`${ariaLabel}下划线`"
          :aria-pressed="activeCommands.underline"
          title="下划线"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('underline'))"
        >U</button>
        <button
          type="button"
          class="note-rich-tool is-strike"
          :class="{ 'is-active': activeCommands.strikeThrough }"
          :aria-label="`${ariaLabel}删除线`"
          :aria-pressed="activeCommands.strikeThrough"
          title="删除线"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('strikeThrough'))"
        >S</button>
      </div>

      <div class="note-rich-toolbar-group">
        <button
          type="button"
          class="note-rich-tool is-wide"
          :class="{ 'is-active': activeCommands.insertUnorderedList }"
          :aria-label="`${ariaLabel}项目符号列表`"
          :aria-pressed="activeCommands.insertUnorderedList"
          title="项目符号列表"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('insertUnorderedList'))"
        >• 列表</button>
        <button
          type="button"
          class="note-rich-tool is-wide"
          :class="{ 'is-active': activeCommands.insertOrderedList }"
          :aria-label="`${ariaLabel}编号列表`"
          :aria-pressed="activeCommands.insertOrderedList"
          title="编号列表"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('insertOrderedList'))"
        >1. 列表</button>
        <button
          type="button"
          class="note-rich-tool is-wide"
          :aria-label="`${ariaLabel}清除格式`"
          title="清除格式"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => runCommand('removeFormat'))"
        >清格式</button>
      </div>

      <div class="note-rich-toolbar-group note-rich-colors" role="group" :aria-label="`${ariaLabel}文字颜色`">
        <button
          v-for="color in NOTE_COLORS"
          :key="color.value"
          type="button"
          class="note-rich-color"
          :aria-label="`${ariaLabel}文字颜色：${color.label}`"
          :title="`文字颜色：${color.label}`"
          @pointerdown="handleToolbarPointerDown"
          @click="handleToolbarClick(() => applyColor(color.value))"
        >
          <span class="note-rich-color-dot" :style="{ backgroundColor: color.value }" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div
      ref="editor"
      class="note-rich-content"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      :aria-label="ariaLabel"
      data-placeholder="写下你们想记住的事…"
      spellcheck="true"
      @input="emitChange"
      @paste="handlePaste"
      @keyup="refreshToolbarState"
      @mouseup="refreshToolbarState"
      @blur="rememberSelection"
    ></div>
  </div>
</template>

<style scoped>
.note-rich-editor {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.note-rich-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.55rem;
  padding: 0.32rem;
  border: 1px solid var(--line, rgba(54, 69, 60, 0.12));
  border-radius: 9px;
  background: color-mix(in srgb, var(--surface-card, #fdfdfa) 72%, var(--surface-soft, #eff1ee));
}

.note-rich-toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.note-rich-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 0.25rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 7px;
  color: var(--text-main, #2b3430);
  background: transparent;
  font: inherit;
  font-size: 0.82em;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
}

.note-rich-tool:hover,
.note-rich-tool:focus-visible {
  border-color: var(--line-strong, rgba(54, 69, 60, 0.24));
  background: var(--surface-card, #fdfdfa);
  outline: none;
}

.note-rich-tool.is-active {
  border-color: var(--accent-border, #c9b8a6);
  background: var(--accent-panel, #f1e9df);
  color: var(--accent-dark, #6f543b);
}

.note-rich-tool.is-wide {
  min-width: 62px;
  font-weight: 600;
  white-space: nowrap;
}

.note-rich-tool.is-italic {
  font-style: italic;
}

.note-rich-tool.is-underline {
  text-decoration: underline;
}

.note-rich-tool.is-strike {
  text-decoration: line-through;
}

.note-rich-colors {
  gap: 0.2rem;
}

.note-rich-color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
}

.note-rich-color:hover,
.note-rich-color:focus-visible {
  border-color: var(--line-strong, rgba(54, 69, 60, 0.24));
  background: var(--surface-card, #fdfdfa);
  outline: none;
}

.note-rich-color-dot {
  width: clamp(18px, 1.05em, 24px);
  height: clamp(18px, 1.05em, 24px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(54, 69, 60, 0.18);
}

.note-rich-content {
  min-height: 8rem;
  padding: 0.35rem 0.1rem;
  border-radius: 6px;
  outline: none;
  color: var(--text-main, #2b3430);
  font: inherit;
  font-size: 0.95em;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.note-rich-content:focus-visible {
  box-shadow: 0 0 0 2px var(--accent-border, #c9b8a6);
}

.note-rich-content:empty::before {
  content: attr(data-placeholder);
  color: var(--text-soft, #69736e);
  pointer-events: none;
}

.note-rich-content :deep(p),
.note-rich-content :deep(div) {
  margin: 0;
}

.note-rich-content :deep(ul),
.note-rich-content :deep(ol) {
  margin: 0.2em 0;
  padding-left: 1.4em;
}

.note-rich-content :deep(li) {
  margin: 0.12em 0;
}

@media (max-width: 720px) {
  .note-rich-toolbar {
    gap: 0.3rem;
  }

  .note-rich-tool,
  .note-rich-color {
    min-width: 38px;
    min-height: 38px;
  }

  .note-rich-color {
    width: 38px;
    height: 38px;
  }
}
</style>
