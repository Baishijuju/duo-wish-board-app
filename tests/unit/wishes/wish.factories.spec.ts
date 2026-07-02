import { describe, expect, it } from 'vitest'
import { createWishComment, createWishImage, createWishRecord, createWishStep } from '../../../src/modules/wishes/wish.factories'

describe('wish.factories', () => {
  it('normalizes count progress and trims fields', () => {
    const wish = createWishRecord({
      title: '  跑步  ',
      category: ' 健康 ',      note: ' 先开始 ',
      ownerId: 'member-a',
      scope: 'shared',
      progressMode: 'count',
      progressCurrent: 9,
      progressTarget: 4,
      progressUnit: ' 次 ',
    })

    expect(wish.title).toBe('跑步')
    expect(wish.category).toBe('健康')
    expect(wish.note).toBe('先开始')
    expect(wish.progressTarget).toBe(4)
    expect(wish.progressCurrent).toBe(4)
    expect(wish.progressUnit).toBe('次')
  })

  it('keeps none mode as a valid complete mode', () => {
    const wish = createWishRecord({
      title: '先写下来',
      category: '',      note: '',
      ownerId: 'member-a',
      scope: 'private',
      progressMode: 'none',
      progressCurrent: 0,
      progressTarget: 0,
      progressUnit: '',
    })

    expect(wish.progressMode).toBe('none')
    expect(wish.progressTarget).toBe(0)
    expect(wish.progressCurrent).toBe(0)
  })

  it('filters empty steps and preserves step mode', () => {
    const wish = createWishRecord({
      title: '旅行',
      category: '生活',      note: '',
      ownerId: 'member-a',
      scope: 'shared',
      progressMode: 'steps',
      progressCurrent: 0,
      progressTarget: 0,
      progressUnit: '',
      steps: [
        createWishStep({ title: ' 先查路线 ' }),
        createWishStep({ title: '   ' }),
      ],
    })

    expect(wish.progressMode).toBe('steps')
    expect(wish.steps).toHaveLength(1)
    expect(wish.steps[0]?.title).toBe('先查路线')
  })

  it('sets completedAt for done wishes', () => {
    const wish = createWishRecord({
      title: '完成事项',
      category: '',      note: '',
      ownerId: 'member-a',
      scope: 'shared',
      progressMode: 'none',
      progressCurrent: 0,
      progressTarget: 0,
      progressUnit: '',
      status: 'done',
    })

    expect(wish.completedAt).toBeTruthy()
  })

  it('trims comment and image fields', () => {
    const comment = createWishComment({
      authorId: 'member-a',
      message: '  记一下  ',
    })
    const image = createWishImage({
      fileName: ' test.jpg ',
      mimeType: ' image/jpeg ',
      sizeBytes: 12,
      storagePath: ' a/b ',
      note: ' 封面 ',
    })

    expect(comment.message).toBe('记一下')
    expect(image.fileName).toBe('test.jpg')
    expect(image.mimeType).toBe('image/jpeg')
    expect(image.storagePath).toBe('a/b')
    expect(image.note).toBe('封面')
  })
})
