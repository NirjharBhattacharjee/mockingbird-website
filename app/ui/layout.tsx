import type { Handle, RemixNode } from 'remix/component'

import { FlavorButton } from '../actions/public/flavor-button.tsx'
import { cx } from '../actions/public/lib/events.ts'
import { links } from './links.ts'

type Vars = Record<string, string>

/** "[g] guide": a nav link with a one-letter shortcut (handled by FlavorButton). */
function Chip(handle: Handle<{ shortcut: string; href: string; class?: string; children?: RemixNode }>) {
  return () => {
    let { shortcut, href, children } = handle.props
    return (
      <li class={handle.props.class}>
        <a href={href} data-key={shortcut} class="chip" aria-keyshortcuts={shortcut}>
          <span aria-hidden="true" class="text-sky">
            [{shortcut}]
          </span>
          {children}
        </a>
      </li>
    )
  }
}

// On the home page the bar is see-through and the bird flies into the home
// link as you scroll (`data-flies`). Elsewhere it's a solid bar.
export function Nav(handle: Handle<{ home?: boolean }>) {
  return () => {
    let home = handle.props.home
    return (
      <header
        class={cx(
          'fixed inset-x-0 top-0 z-50',
          home ? 'pointer-events-none' : 'border-b border-surface0 bg-crust/85 backdrop-blur-md',
        )}
      >
        <nav aria-label="Main" class="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4">
          <a
            id="home-slot"
            href="/"
            data-flies={home ? '' : undefined}
            class="pointer-events-auto flex items-center gap-2.5"
            aria-label="mockingbird home"
          >
            <img src="/brand/logo.png" alt="" width="22" height="28" class="pixelated h-7 w-auto" />
            <span class="hidden text-[16px] font-extrabold tracking-tight text-sky sm:inline">mockingbird</span>
          </a>
          <ul class="pointer-events-auto ml-auto flex items-center gap-1.5">
            <Chip shortcut="i" href="/#install" class="hidden md:block">
              install
            </Chip>
            <Chip shortcut="g" href={links.docs}>
              guide
            </Chip>
            <Chip shortcut="p" href={links.philosophy} class="hidden sm:block">
              philosophy
            </Chip>
            <Chip shortcut="h" href={links.repo} class="hidden sm:block">
              github
            </Chip>
            <li>
              <FlavorButton />
            </li>
          </ul>
        </nav>
      </header>
    )
  }
}

// One full-height section of the home page: a stage the pixel field draws
// this scene's shape into, beside a panel of content.
export function Scene(handle: Handle<{ id: string; shape: string; flip?: boolean; children?: RemixNode }>) {
  return () => {
    let { id, shape, flip, children } = handle.props
    return (
      <section id={id} data-scene={id} data-shape={shape} class="relative z-10 flex min-h-[100svh] items-center">
        <div
          class={cx(
            // leaves room on the left for the section index
            'mx-auto grid w-full max-w-[1200px] items-center gap-6 px-4 py-24 md:gap-12 xl:pl-60',
            flip ? 'md:grid-cols-[7fr_5fr]' : 'md:grid-cols-[5fr_7fr]',
          )}
        >
          <div data-stage aria-hidden="true" class={cx('h-48 md:h-[min(30rem,70svh)]', flip && 'md:order-last')} />
          <div class="reveal panel min-w-0">{children}</div>
        </div>
      </section>
    )
  }
}

export function SceneHead(handle: Handle<{ title: RemixNode; lede?: RemixNode }>) {
  return () => (
    <div class="mb-7">
      <h2 class="scene-title">{handle.props.title}</h2>
      {handle.props.lede && <p class="mt-4 max-w-[46ch] text-[17px] text-soft">{handle.props.lede}</p>}
    </div>
  )
}

export interface Tab {
  label: string
  color?: string
  body: RemixNode
}

// Radio buttons styled as tabs (see .tabs in app.css), so they work without
// JavaScript and the arrow keys move between them.
export function Tabs(handle: Handle<{ name: string; label: string; tabs: Tab[] }>) {
  return () => {
    let { name, label, tabs } = handle.props
    return (
      <div class="tabs">
        <fieldset class="tablist">
          <legend class="sr-only">{label}</legend>
          {tabs.map((tab, i) => (
            <label style={tab.color ? ({ '--tab': tab.color } as Vars) : undefined}>
              <input type="radio" class="sr-only" name={name} value={String(i)} checked={i === 0} />
              {tab.label}
            </label>
          ))}
        </fieldset>
        {tabs.map((tab) => (
          <div class="tabpanel mt-6">{tab.body}</div>
        ))}
      </div>
    )
  }
}

export function ArrowLink(handle: Handle<{ href: string; children?: RemixNode }>) {
  return () => (
    <a href={handle.props.href} class="link text-[15px]">
      {handle.props.children} →
    </a>
  )
}

export function Footer() {
  let columns: [string, [string, string][]][] = [
    ['Explore', [['Demo', '/#demo'], ['How it works', '/#how'], ['Install', '/#install'], ["What's next", '/#next']]],
    ['Docs', [['User guide', links.docs], ['Architecture', links.architecture], ['Models', links.models], ['Troubleshooting', links.troubleshooting]]],
    ['Project', [['GitHub', links.repo], ['Releases', links.releases], ['Security & privacy', links.privacy], ['License (MIT)', links.license]]],
    ['Community', [['Issues', links.issues], ['Contributing', links.contributing], ['Philosophy', links.philosophy]]],
  ]
  return () => (
    <footer id="footer" class="relative z-10 border-t border-surface0 bg-crust">
      <div class="mx-auto grid max-w-[1200px] gap-10 px-4 pt-16 pb-20 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div class="space-y-3">
          <p class="text-[18px] font-extrabold text-sky">mockingbird</p>
          <p class="text-[14px] text-overlay">
            Local voice dictation for macOS.
            <br />
            Free forever. Your voice never leaves your Mac.
          </p>
          <p class="text-[14px] text-green">No analytics or trackers on this site.</p>
        </div>
        {columns.map(([title, items]) => (
          <div>
            <p class="mb-3 text-[14px] font-bold text-text">{title}</p>
            <ul class="space-y-2 text-[14px]">
              {items.map(([label, href]) => (
                <li>
                  <a href={href} class="text-soft hover:text-text">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div class="mx-auto max-w-[1200px] border-t border-surface0 px-4 py-5 text-[13px] text-overlay">
        MIT licensed. Made with open source, for everyone.
      </div>
    </footer>
  )
}
