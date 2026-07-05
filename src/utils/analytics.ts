export type AnalyticsEventName = 'copy_expand' | 'copy_collapse'

export type AnalyticsEventPayload = {
  layer?: string
  page?: string
  target?: string
}

declare global {
  interface Window {
    __DUO_WISH_ANALYTICS__?: Array<{
      name: AnalyticsEventName
      payload: AnalyticsEventPayload
      timestamp: string
    }>
  }
}

export function trackAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const event = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  }

  window.__DUO_WISH_ANALYTICS__ = window.__DUO_WISH_ANALYTICS__ ?? []
  window.__DUO_WISH_ANALYTICS__.push(event)
  window.dispatchEvent(new CustomEvent('duo-wish-analytics', { detail: event }))

  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, payload)
  }
}
