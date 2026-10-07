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

/** The home page's scenes, top to bottom. */
export function scenes(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-scene]')]
}

/** The scene you're reading: the last one whose top has passed 45% of the viewport. */
export function currentSceneIndex(list: HTMLElement[]): number {
  let line = window.innerHeight * 0.45
  let index = 0
  list.forEach((scene, i) => {
    if (scene.getBoundingClientRect().top <= line) index = i
  })
  return index
}

/**
 * Whether a key press is free for the page's shortcuts: no Cmd, Ctrl or Alt
 * (those belong to the browser), and not typed into a text field.
 */
export function isPageShortcut(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return false
  let target = e.target
  return !(target instanceof Element && target.closest('input:not([type=radio], [type=checkbox]), textarea, select, [contenteditable]'))
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
