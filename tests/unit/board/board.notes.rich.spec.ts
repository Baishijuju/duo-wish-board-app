import { describe, expect, it } from 'vitest'
import {
  isAllowedNoteTag,
  notePlainTextToHtml,
  sanitizeNoteColor,
  sanitizeNoteStyle,
} from '../../../src/modules/board/board.notes.rich'

describe('isAllowedNoteTag', () => {
  it('放行备忘录级别的格式标签', () => {
    for (const tag of ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'div', 'p', 'ul', 'ol', 'li', 'span']) {
      expect(isAllowedNoteTag(tag)).toBe(true)
    }
  })

  it('大小写不敏感', () => {
    expect(isAllowedNoteTag('B')).toBe(true)
    expect(isAllowedNoteTag('Strong')).toBe(true)
  })

  it('拒绝脚本与外部内容', () => {
    for (const tag of ['script', 'iframe', 'object', 'embed', 'style', 'img', 'a', 'form']) {
      expect(isAllowedNoteTag(tag)).toBe(false)
    }
  })
})

describe('sanitizeNoteStyle', () => {
  it('保留合法颜色', () => {
    expect(sanitizeNoteStyle('color:#c0392b')).toBe('color:#c0392b')
    expect(sanitizeNoteStyle('color: #fff')).toBe('color:#fff')
    expect(sanitizeNoteStyle('color:rgb(200, 60, 90)')).toBe('color:rgb(200, 60, 90)')
  })

  it('丢掉颜色以外的所有声明', () => {
    expect(sanitizeNoteStyle('position:fixed;color:#fff')).toBe('color:#fff')
    expect(sanitizeNoteStyle('background-image:url(x)')).toBe('')
    expect(sanitizeNoteStyle('font-size:200px')).toBe('')
  })

  it('拒绝不安全的颜色写法', () => {
    expect(sanitizeNoteStyle('color:expression(alert(1))')).toBe('')
    expect(sanitizeNoteStyle('color:url(evil)')).toBe('')
    expect(sanitizeNoteStyle('color:var(--x)')).toBe('')
  })

  it('空值安全', () => {
    expect(sanitizeNoteStyle(null)).toBe('')
    expect(sanitizeNoteStyle(undefined)).toBe('')
    expect(sanitizeNoteStyle('')).toBe('')
  })
})

describe('sanitizeNoteColor', () => {
  it('接受十六进制与 rgb 写法', () => {
    expect(sanitizeNoteColor('#c0392b')).toBe('#c0392b')
    expect(sanitizeNoteColor(' #fff ')).toBe('#fff')
    expect(sanitizeNoteColor('rgba(200, 60, 90, 0.5)')).toBe('rgba(200, 60, 90, 0.5)')
  })

  it('拒绝脚本式颜色与空值', () => {
    expect(sanitizeNoteColor('red;position:fixed')).toBe('')
    expect(sanitizeNoteColor('expression(alert(1))')).toBe('')
    expect(sanitizeNoteColor(null)).toBe('')
  })
})

describe('notePlainTextToHtml', () => {
  it('转义 HTML，避免老便签里的尖括号被当成标签', () => {
    expect(notePlainTextToHtml('<b>不是粗体</b> & "引号"')).toBe('&lt;b&gt;不是粗体&lt;/b&gt; &amp; &quot;引号&quot;')
  })

  it('把换行保留成 br，并统一换行符', () => {
    expect(notePlainTextToHtml('第一行\r\n第二行\n第三行')).toBe('第一行<br>第二行<br>第三行')
  })

  it('空值安全', () => {
    expect(notePlainTextToHtml('')).toBe('')
    expect(notePlainTextToHtml(null)).toBe('')
  })
})
