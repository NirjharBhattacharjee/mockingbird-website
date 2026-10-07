import { clientEntry, on, type Handle } from 'remix/component'

import {
  type TalkState,
  currentSceneIndex,
  cx,
  isPageShortcut,
  onTalk,
  prefersReducedMotion,
  scenes,
} from './lib/events.ts'

interface Scene {
  id: string
  label: string
  accent: string
}

const STATUS: Record<TalkState, [string, string]> = {
  idle: ['idle', 'hold F to talk'],
  listening: ['listening…', 'let go to type'],
  transcribing: ['transcribing…', 'on this Mac, offline'],
  typed: ['typed at your cursor', 'nothing left the machine'],
}

// Bottom left: where you are on the page, and what the demo bird is doing.
// Also owns ↑ and ↓, which jump between scenes.
export const SectionIndex = clientEntry(import.meta.url, function SectionIndex(handle: Handle<{ scenes: Scene[] }>) {
  let current = 0
  let talk: TalkState = 'idle'
  let list: HTMLElement[] = []

  function go(i: number) {
    let target = list[Math.max(0, Math.min(list.length - 1, i))]
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  handle.queueTask(() => {
    let signal = handle.signal
    list = scenes()
    let sync = () => {
      let next = currentSceneIndex(list)
      if (next === current) return
      current = next
      handle.update()
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true, signal })
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.shiftKey || !isPageShortcut(e)) return
        // the tabs are radio buttons, which use the arrow keys themselves
        if (e.target instanceof HTMLInputElement) return
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
        e.preventDefault()
        go(current + (e.key === 'ArrowDown' ? 1 : -1))
      },
      { signal },
    )
    onTalk((state) => {
      talk = state
      handle.update()
    }, signal)
  })

  return () => {
    let [title, sub] = STATUS[talk]
    let accent = handle.props.scenes[current]?.accent
    return (
      <aside
        aria-label="Sections"
        class="fixed bottom-4 left-4 z-40 hidden w-52 border border-surface0 bg-mantle/90 p-3 text-[13px] backdrop-blur xl:block"
      >
        <p role="status" aria-live="polite" class="mb-2.5 flex items-center gap-2 border-b border-surface0 pb-2.5 leading-tight">
          <i class={cx('block size-2 shrink-0', talk === 'listening' ? 'animate-pulse bg-red' : talk === 'idle' ? 'bg-overlay' : 'bg-green')} />
          <span>
            <span class="block text-text">{title}</span>
            <span class="block text-overlay">{sub}</span>
          </span>
        </p>
        <ol class="relative pl-4">
          <i
            aria-hidden="true"
            class="absolute left-0 block w-1 transition-[top,background-color] duration-300"
            style={{ top: `calc(${current} * 1.6rem + 0.25rem)`, height: '1.1rem', background: accent }}
          />
          {handle.props.scenes.map((scene, i) => (
            <li>
              <a
                href={`#${scene.id}`}
                aria-current={i === current ? 'true' : undefined}
                class={cx('block h-[1.6rem] leading-[1.6rem]', i === current ? 'font-bold text-text' : 'text-overlay hover:text-text')}
                mix={on('click', (e) => {
                  e.preventDefault()
                  go(i)
                })}
              >
                {scene.label}
              </a>
            </li>
          ))}
        </ol>
      </aside>
    )
  }
})
