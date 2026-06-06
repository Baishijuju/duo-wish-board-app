export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `wish-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
