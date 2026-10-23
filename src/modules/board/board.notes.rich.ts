/**
 * 便签富文本的 HTML 白名单过滤。
 *
 * 为什么必须做：富文本存的是 HTML，而 HTML 是可以带 `<script>`、`onclick`、
 * `javascript:` 链接的。便签是两个人互相看的内容，哪怕彼此信任，
 * 也从别处粘贴进来的东西不可控，所以渲染前一律过滤。
 *
 * 设计取舍：
 *   - 只放行「备忘录级别」的标签：加粗/斜体/下划线/删除线/颜色/列表/换行。
 *   - `style` 只保留 `color`，其余（position、background-image 之类）全丢 —— 那些是
 *     常见的绕过手法，而且便签根本不需要。
 *   - 用 DOMParser 解析而非正则：正则过滤 HTML 是不安全的，解析成 DOM 再按白名单
 *     重建才可靠。
 */

export const ALLOWED_NOTE_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'BR',
  'DIV', 'P', 'UL', 'OL', 'LI', 'SPAN',
])

/** 只允许这些颜色写法：#rgb / #rrggbb / 简单的 rgb() */
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i

export function isAllowedNoteTag(tagName: string): boolean {
  return ALLOWED_NOTE_TAGS.has(tagName.toUpperCase())
}

/**
 * 过滤 style 属性，只留一个安全的颜色值。
 * 返回空串表示这个 style 整个丢掉。
 */
export function sanitizeNoteStyle(style: string | null | undefined): string {
  if (!style) return ''

  const match = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style)
  if (!match) return ''

  const color = match[1]!.trim()

  return SAFE_COLOR.test(color) ? `color:${color}` : ''
}

/**
 * 把一段用户 HTML 过滤成安全 HTML。
 * 只有在浏览器里才能跑（需要 DOMParser）；服务端渲染时调用方要自己兜底。
 */
export function sanitizeNoteHtml(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) return ''
  if (typeof DOMParser === 'undefined') return ''

  const doc = new DOMParser().parseFromString(`<div id="root">${input}</div>`, 'text/html')
  const root = doc.getElementById('root')
  if (!root) return ''

  const output = doc.createElement('div')

  const copyChildren = (source: Node, target: Node) => {
    for (const node of Array.from(source.childNodes)) {
      if (node.nodeType === 3) {
        target.appendChild(doc.createTextNode(node.textContent ?? ''))
        continue
      }

      if (node.nodeType !== 1) continue

      const element = node as HTMLElement
      const tag = element.tagName.toUpperCase()

      // 明确丢掉的危险标签（连同内容一起丢）
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED') {
        continue
      }

      if (!isAllowedNoteTag(tag)) {
        // 不认识的标签：保留里面的文字，但不要这个标签本身
        copyChildren(element, target)
        continue
      }

      const clean = doc.createElement(tag.toLowerCase())
      const style = sanitizeNoteStyle(element.getAttribute('style'))
      if (style) clean.setAttribute('style', style)

      copyChildren(element, clean)
      target.appendChild(clean)
    }
  }

  copyChildren(root, output)

  return output.innerHTML
}

/** 从富文本里取纯文本，用于 `text` 字段的兜底与「长便签」判断 */
export function noteHtmlToPlainText(input: unknown): string {
  if (typeof input !== 'string' || !input) return ''
  if (typeof DOMParser === 'undefined') return ''

  const doc = new DOMParser().parseFromString(`<div id="root">${input}</div>`, 'text/html')
  const root = doc.getElementById('root')

  return root ? (root.textContent ?? '').replace(/\u00a0/g, ' ').trim() : ''
}
