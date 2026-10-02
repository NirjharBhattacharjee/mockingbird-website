import type { Handle, RemixNode } from 'remix/component'

import { FlavorButton } from '../actions/public/flavor-button.tsx'
import { PixelField } from '../actions/public/pixel-field.tsx'
import { links } from './links.ts'

export function Nav() {
  return () => (
    <header class="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-crust/70 backdrop-blur-md supports-[backdrop-filter]:bg-crust/55">
      <nav aria-label="Main" class="mx-auto flex h-12 max-w-[1060px] items-center gap-6 px-4">
        <a href="/" class="flex items-center gap-2" aria-label="mockingbird home">
          <img src="/brand/logo.png" alt="" width="18" height="23" class="pixelated h-[22px] w-auto" />
        </a>
        <ul class="hidden items-center gap-5 text-[12px] text-soft sm:flex">
          <li>
            <a class="hover:text-text" href="#demo">
              Demo
            </a>
          </li>
          <li>
            <a class="hover:text-text" href="#how">
              How it works
            </a>
          </li>
          <li>
            <a class="hover:text-text" href="#commands">
              Commands
            </a>
          </li>
          <li>
            <a class="hover:text-text" href={links.docs}>
              Docs
            </a>
          </li>
        </ul>
        <div class="ml-auto flex items-center gap-1">
          <FlavorButton />
          <a href={links.repo} class="px-2 py-1.5 text-soft hover:text-text" aria-label="mockingbird on GitHub">
            <GitHubIcon />
          </a>
          <a href="#install" class="btn-primary ml-1 px-3 py-1">
            Install
          </a>
        </div>
      </nav>
    </header>
  )
}

export function Section(handle: Handle<{ id?: string; tone?: 'base' | 'mantle'; children?: RemixNode }>) {
  return () => {
    let { id, tone = 'base', children } = handle.props
    return (
      <section id={id} class={tone === 'mantle' ? 'bg-mantle' : 'bg-base'}>
        <div class="reveal mx-auto max-w-[1060px] px-4 py-20 sm:py-24">{children}</div>
      </section>
    )
  }
}

export function SectionHead(handle: Handle<{ title: RemixNode; lede?: RemixNode; aside?: RemixNode }>) {
  return () => {
    let { title, lede, aside } = handle.props
    return (
      <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-[38rem]">
          <h2 class="section-title">{title}</h2>
          {lede && <p class="mt-3 text-soft">{lede}</p>}
        </div>
        {aside}
      </div>
    )
  }
}

export function ArrowLink(handle: Handle<{ href: string; children?: RemixNode }>) {
  return () => (
    <a href={handle.props.href} class="link text-[12px]">
      {handle.props.children} →
    </a>
  )
}

export function Footer() {
  let columns: [string, [string, string][]][] = [
    ['Explore', [['Demo', '#demo'], ['How it works', '#how'], ['Install', '#install'], ['Commands', '#commands']]],
    ['Docs', [['Readme', links.docs], ['Architecture', links.architecture], ['Models', links.models], ['Troubleshooting', links.troubleshooting]]],
    ['Project', [['GitHub', links.repo], ['Releases', links.releases], ['Security & privacy', links.privacy], ['License (MIT)', links.license]]],
    ['Community', [['Issues', links.issues], ['Contributing', links.contributing], ['Philosophy', links.philosophy]]],
  ]
  return () => (
    <footer id="footer" class="relative overflow-hidden border-t border-surface0 bg-crust">
      <PixelField horizon={0} density={0.035} />
      <div class="relative mx-auto grid max-w-[1060px] gap-10 px-4 pt-16 pb-24 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div class="space-y-3 bg-crust/80" data-pixel-avoid>
          <p class="font-mono text-[15px] font-bold text-sky">mockingbird</p>
          <p class="text-[12px] text-overlay">
            Local voice dictation for macOS.
            <br />
            Free forever. Your voice never leaves your Mac.
          </p>
          <p class="text-[12px] text-green">No analytics or trackers on this site.</p>
        </div>
        {columns.map(([title, items]) => (
          <div class="bg-crust/80" data-pixel-avoid>
            <p class="mb-3 text-[11px] tracking-[0.18em] text-overlay uppercase">{title}</p>
            <ul class="space-y-2 text-[12px]">
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
      <div class="relative mx-auto max-w-[1060px] border-t border-surface0 px-4 py-5 text-[11px] text-overlay">
        <span class="bg-crust/80">MIT licensed. Made with open source, for everyone.</span>
      </div>
    </footer>
  )
}

export function GitHubIcon() {
  return () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
