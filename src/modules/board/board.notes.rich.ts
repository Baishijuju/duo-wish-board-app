/**
 * 便签富文本的 HTML 白名单过滤与纯文本互转。
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

/** 只允许这些颜色写法：#rgb / #rgba / #rrggbb / #rrggbbaa / 简单的 rgb()/rgba() */
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i

const NOTE_BLOCK_TAGS = new Set(['DIV', 'P', 'LI'])

export function isAllowedNoteTag(tagName: string): boolean {
  return ALLOWED_NOTE_TAGS.has(tagName.toUpperCase())
}

/** 把颜色规范成可安全写入 style 的值；不合法时返回空串。 */
export function sanitizeNoteColor(value: string | null | undefined): string {
  if (!value) return ''

  const color = value.trim()
  return SAFE_COLOR.test(color) ? color : ''
}

/**
 * 过滤 style 属性，只留一个安全的颜色值。
 * 返回空串表示这个 style 整个丢掉。
 */
export function sanitizeNoteStyle(style: string | null | undefined): string {
  if (!style) return ''

  const match = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style)
  if (!match) return ''

  const color = sanitizeNoteColor(match[1])
  return color ? `color:${color}` : ''
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

      // execCommand('foreColor') 在部分 WebKit 版本里生成的是 <font color="…">，
      // 统一改写成允许的 span[style]，这样颜色不会在保存时被过滤掉。
      if (tag === 'FONT') {
        const color = sanitizeNoteColor(element.getAttribute('color'))
        if (!color) {
          copyChildren(element, target)
          continue
        }

        const clean = doc.createElement('span')
        clean.setAttribute('style', `color:${color}`)
        copyChildren(element, clean)
        target.appendChild(clean)
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

function escapeNoteHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 把便签的纯文本字段转成编辑器可用的 HTML。
 * 老便签只有 text，没有 html；进入编辑时用这个函数补出安全内容。
 */
export function notePlainTextToHtml(input: unknown): string {
  if (typeof input !== 'string' || !input) return ''

  return input
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => escapeNoteHtmlText(line))
    .join('<br>')
}

/**
 * 从富文本里取纯文本，用于 `text` 字段的兜底、长便签判断和旧客户端显示。
 *
 * 不能直接用 textContent：那会把 <div> / <p> / <li> / <br> 之间的换行全吃掉，
 * 列表也会粘成一行。这里按块级标签补换行，并给列表加上「• / 1.」前缀，
 * 保证降级到纯文本时仍然可读。
 */
export function noteHtmlToPlainText(input: unknown): string {
  if (typeof input !== 'string' || !input) return ''
  if (typeof DOMParser === 'undefined') return ''

  const doc = new DOMParser().parseFromString(`<div id="root">${input}</div>`, 'text/html')
  const root = doc.getElementById('root')
  if (!root) return ''

  let output = ''

  const pushLineBreak = () => {
    if (output && !output.endsWith('\n')) output += '\n'
  }

  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      output += (node.textContent ?? '').replace(/\u00a0/g, ' ')
      return
    }

    if (node.nodeType !== 1) return

    const element = node as HTMLElement
    const tag = element.tagName.toUpperCase()

    if (tag === 'BR') {
      output += '\n'
      return
    }

    const isBlock = NOTE_BLOCK_TAGS.has(tag)
    if (isBlock) pushLineBreak()

    if (tag === 'LI') {
      const parentTag = element.parentElement?.tagName.toUpperCase()
      if (parentTag === 'OL') {
        const siblings = Array.from(element.parentElement?.children ?? [])
          .filter((child) => child.tagName.toUpperCase() === 'LI')
        output += `${siblings.indexOf(element) + 1}. `
      } else if (parentTag === 'UL') {
        output += '• '
      }
    }

    for (const child of Array.from(element.childNodes)) {
      walk(child)
    }

    if (isBlock) pushLineBreak()
  }

  walk(root)

  return output
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
