// Page-wide events the hydrated pieces use to talk to each other. They're
// plain window events so separately hydrated components need no shared state.

export type TalkState = 'idle' | 'listening' | 'transcribing' | 'typed'

export const THEME_EVENT = 'mb:theme'
export const TALK_EVENT = 'mb:talk'

export function emitTalk(state: TalkState) {
  window.dispatchEvent(new CustomEvent<TalkState>(TALK_EVENT, { detail: state }))
}

export function onTalk(listener: (state: TalkState) => void, signal: AbortSignal) {
  window.addEventListener(TALK_EVENT, (e) => listener((e as CustomEvent<TalkState>).detail), { signal })
}

export function onTheme(listener: () => void, signal: AbortSignal) {
  window.addEventListener(THEME_EVENT, listener, { signal })
}

export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Keyboard shortcuts shouldn't fire while someone is typing in a field. */
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]'))
}

export function storage(key: string) {
  return {
    get(): string | null {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set(value: string) {
      try {
        localStorage.setItem(key, value)
      } catch {}
    },
  }
}

/** Joins class names, skipping falsy ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
