import type { Handle, RemixNode } from 'remix/component'

import { ArrowLink, Footer, GitHubIcon, Nav, Section, SectionHead } from '../ui/layout.tsx'
import { install, links } from '../ui/links.ts'
import { Document } from './document.tsx'
import { CopyButton } from './public/copy-button.tsx'
import { PixelField } from './public/pixel-field.tsx'
import { StatusWidget } from './public/status-widget.tsx'
import { TalkDemo } from './public/talk-demo.tsx'
import { Toast } from './public/toast.tsx'
import { TypedText } from './public/typed-text.tsx'

type Vars = Record<string, string>
const delay = (i: number) => ({ '--i': String(i) }) as Vars

export function HomePage() {
  return () => (
    <Document>
      <Nav />
      <main>
        <Hero />
        <About />
        <Demo />
        <HowItWorks />
        <Install />
        <Commands />
        <Numbers />
        <GetInvolved />
      </main>
      <Footer />
      <Toast />
      <StatusWidget />
    </Document>
  )
}

// ---------------------------------------------------------------------------

function Hero() {
  return () => (
    <section
      id="hero"
      class="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-crust px-4 pt-20 pb-36"
    >
      <PixelField wordSlotId="wordmark-slot" birdSlotId="bird-slot" birdSrc="/brand/logo.png" horizon={0.22} />

      <div class="relative flex w-full flex-col items-center text-center">
        <a
          href={links.releases}
          data-pixel-avoid
          class="rise border border-sky/40 bg-crust px-3 py-1 text-[12px] text-sky hover:border-sky"
        >
          v0.1.1 is out. See what's new →
        </a>

        <div id="bird-slot" aria-hidden="true" class="mt-8" style={{ width: 'calc(var(--px) * 20)', height: 'calc(var(--px) * 26)' }} />

        <div
          id="wordmark-slot"
          class="mt-3 grid max-w-full place-items-center"
          style={{ width: 'calc(var(--px) * 86)', height: 'calc(var(--px) * 14)' }}
        >
          <h1>
            <span class="sr-only">mockingbird</span>
            <span aria-hidden="true" class="no-js-only font-mono text-5xl font-bold text-sky">
              mockingbird
            </span>
          </h1>
        </div>

        <p data-pixel-avoid class="rise mt-6 bg-crust/70 text-[17px] text-yellow sm:text-[19px]" style={delay(0)}>
          Local voice dictation for macOS
        </p>
        <p data-pixel-avoid class="rise mt-3 max-w-[34rem] bg-crust/70 text-soft" style={delay(1)}>
          Hold Fn, speak, let go. Clean text lands at your cursor.
          <br class="hidden sm:block" /> Free forever, and your voice never leaves your Mac.
        </p>
        <div data-pixel-avoid class="rise mt-7 flex flex-wrap justify-center gap-3" style={delay(2)}>
          <a href="#install" class="btn-primary">
            <span aria-hidden="true">↓</span> Get mockingbird
          </a>
          <a href="#demo" class="btn-ghost">
            <span aria-hidden="true">▶</span> See it in action
          </a>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function About() {
  return () => (
    <Section id="about">
      <div class="grid gap-12 md:grid-cols-[1.25fr_1fr] md:items-center">
        <div>
          <h2 class="section-title">
            Your words aren't <TypedText phrases={['metered.', 'uploaded.', 'stored.', 'for sale.']} />
          </h2>
          <div class="mt-6 space-y-4 text-soft">
            <p>
              Cloud dictation is good software with a meter on it: a credit cap that runs out and reminds you,
              mid-sentence, that your own words are being counted. Mockingbird has no meter.
            </p>
            <p>
              A capable speech model, a small language model for cleanup, and a hotkey. That's all dictation needs,
              and all of it runs on your Mac. No account, no cloud, no usage limits.
            </p>
            <p>
              It's MIT licensed and built in the open, as a way of giving back to the open-source projects it's built
              on. <ArrowLink href={links.philosophy}>Read the philosophy</ArrowLink>
            </p>
          </div>
        </div>

        <figure class="card p-6">
          <p aria-hidden="true" class="font-sans text-4xl leading-none text-mauve">
            “
          </p>
          <blockquote class="mt-2 font-sans text-[17px] leading-snug text-text">
            A tool this useful gatekept behind a credit meter isn't a technical necessity, it's a business model choice,
            and this project is the alternative to that choice.
          </blockquote>
          <figcaption class="mt-5 flex items-center gap-3 border-t border-surface0 pt-4">
            <img src="/brand/logo.png" alt="" width="26" height="33" class="pixelated h-8 w-auto" />
            <span>
              <span class="block text-text">Nirjhar Bhattacharjee</span>
              <span class="block text-[12px] text-overlay">Creator of mockingbird</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Demo() {
  let steps: [string, string, RemixNode][] = [
    ['01', 'Hold Fn', <>Anywhere: Slack, Mail, your editor, a browser tab. A rising <em class="text-green not-italic">tink</em> means it's listening.</>],
    ['02', 'Speak', <>Ramble a little. Pauses, "um"s and restarts get cleaned up. Double-tap Fn for hands-free.</>],
    ['03', 'Let go', <>A falling <em class="text-sky not-italic">pop</em>, and a tidy sentence is typed where your cursor is.</>],
  ]
  return () => (
    <Section id="demo" tone="mantle">
      <SectionHead
        title="See it in action"
        lede={<>Run <code class="text-sky">mockingbird start</code> once. After that it's just a key, in every app, at every login.</>}
      />
      <TalkDemo />
      <ol class="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map(([n, title, body]) => (
          <li class="card p-5">
            <p class="flex items-baseline gap-3">
              <span class="text-[12px] text-overlay">{n}</span>
              <span class="font-sans text-[17px] font-semibold text-text">{title}</span>
            </p>
            <p class="mt-2 text-[12px] text-soft">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function HowItWorks() {
  let stages: [string, string, string, string][] = [
    ['01 · listen', 'Voice activity', 'Silero VAD finds where speech starts and stops, in 32 ms windows.', 'var(--teal)'],
    ['02 · hear', 'Speech to text', 'Whisper large-v3-turbo, through whisper.cpp, turns audio into words.', 'var(--sky)'],
    ['03 · tidy', 'Cleanup', 'Qwen3-4B-Instruct fixes punctuation, filler words and lists.', 'var(--mauve)'],
    ['04 · type', 'At your cursor', 'The text is typed into whatever app is in front.', 'var(--peach)'],
  ]
  return () => (
    <Section id="how">
      <SectionHead
        title="How it works"
        lede="Three open models, each doing the one job it's best at, all served from 127.0.0.1."
        aside={<ArrowLink href={links.architecture}>Architecture</ArrowLink>}
      />
      <ol class="grid gap-4 md:grid-cols-4 md:gap-0">
        {stages.map(([tag, title, body, color], i) => (
          <li class="flex items-stretch">
            <div class="stage card flex-1 p-5" style={{ '--stage': color, '--d': `${i}s` } as Vars}>
              <p class="text-[11px] tracking-[0.18em] uppercase" style={{ color }}>
                {tag}
              </p>
              <p class="mt-2 font-sans text-[17px] font-semibold text-text">{title}</p>
              <p class="mt-2 text-[12px] text-soft">{body}</p>
            </div>
            {i < stages.length - 1 && (
              <div aria-hidden="true" class="relative hidden w-6 shrink-0 self-center md:block">
                <div class="h-[2px] bg-surface1" />
                <i class="pulse-dot absolute -top-[3px] block size-2 bg-sky" style={{ '--d': `${i + 0.6}s` } as Vars} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <p class="mt-6 border border-surface0 px-4 py-3 text-[12px] text-soft">
        <span class="text-green">●</span> Short, clean utterances skip the language model entirely, so they're faster.
        The only network call mockingbird ever makes is the one you run: <code class="text-sky">{install.pull}</code>.
      </p>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function InstallCard(handle: Handle<{ icon: string; title: string; body: RemixNode; command: string; foot: RemixNode }>) {
  return () => {
    let { icon, title, body, command, foot } = handle.props
    return (
      <div class="card flex flex-col p-5">
        <p class="flex items-center gap-2 font-sans text-[16px] font-semibold text-text">
          <span aria-hidden="true" class="text-sky">
            {icon}
          </span>
          {title}
        </p>
        <p class="mt-2 text-[12px] text-soft">{body}</p>
        <pre class="mt-4 overflow-x-auto border border-surface0 bg-crust px-3 py-2.5 text-[12px] text-text">
          <span class="text-green">$ </span>
          {command}
        </pre>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <CopyButton text={command} label="Copy command" />
          <span class="text-[11px] text-overlay">{foot}</span>
        </div>
      </div>
    )
  }
}

function Install() {
  return () => (
    <Section id="install" tone="mantle">
      <SectionHead
        title="Install mockingbird"
        lede="You need a Mac with Apple Silicon, Homebrew, and about 6 GB free for the models."
        aside={<ArrowLink href={links.manualInstall}>Install by hand</ArrowLink>}
      />
      <div class="grid gap-4 md:grid-cols-2">
        <InstallCard
          icon="▣"
          title="Homebrew"
          body={<>Install, then fetch the models once with <code class="text-sky">{install.pull}</code>.</>}
          command={install.brew}
          foot="Update with brew upgrade mockingbird."
        />
        <InstallCard
          icon="▤"
          title="Install script"
          body="Installs mockingbird and pulls the models in one go."
          command={install.script}
          foot="Safe to run again. Run it again to update."
        />
      </div>
      <div class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-soft">
        <span>
          Then run <code class="text-sky">mockingbird start</code>. The first time, macOS asks for
        </span>
        {[
          ['Microphone', 'text-teal border-teal/40'],
          ['Accessibility', 'text-sky border-sky/40'],
          ['Input Monitoring', 'text-mauve border-mauve/40'],
        ].map(([label, cls]) => (
          <span class={`border px-2 py-0.5 ${cls}`}>{label}</span>
        ))}
        <span>
          then <code class="text-sky">mockingbird restart</code>.
        </span>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function Commands() {
  let rows: [string, string][] = [
    ['mockingbird start', 'Run in the background, now and at every login'],
    ['mockingbird stop', 'Stop, and stay stopped across reboots'],
    ['mockingbird restart', 'Restart (do this after granting a permission)'],
    ['mockingbird status', "Whether it's running, and which permissions it has"],
    ['mockingbird listen', 'Dictate live in a terminal, with a level meter'],
    ['mockingbird transcribe <file>', 'Turn a recording (mp3, m4a, wav…) into text'],
    ['mockingbird type --check', 'Check typing permission and the app in front'],
  ]
  return () => (
    <Section id="commands">
      <SectionHead title="A tiny CLI, and one key" lede="You set it up in a terminal once. After that it lives on the Fn key." />
      <div class="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div class="card overflow-x-auto">
          <table class="w-full text-left text-[12px]">
            <thead class="border-b border-surface0 text-[11px] tracking-[0.18em] text-overlay uppercase">
              <tr>
                <th class="px-4 py-2.5 font-normal">Command</th>
                <th class="px-4 py-2.5 font-normal">Does</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([cmd, does]) => (
                <tr class="border-b border-surface0 last:border-0 hover:bg-surface0/40">
                  <td class="px-4 py-2.5 whitespace-nowrap text-sky">{cmd}</td>
                  <td class="px-4 py-2.5 text-soft">{does}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div class="space-y-4">
          <div class="card p-5">
            <p class="text-[11px] tracking-[0.18em] text-overlay uppercase">Keys</p>
            <p class="mt-3 flex items-center gap-3 text-[12px] text-soft">
              <kbd class="kbd">fn</kbd> hold: record while held
            </p>
            <p class="mt-3 flex items-center gap-3 text-[12px] text-soft">
              <span class="flex gap-1">
                <kbd class="kbd">fn</kbd>
                <kbd class="kbd">fn</kbd>
              </span>
              double-tap: hands-free until the next Fn
            </p>
          </div>
          <div class="card p-5">
            <p class="text-[11px] tracking-[0.18em] text-overlay uppercase">Sounds</p>
            {[
              ['↗ tink', 'text-green', "it's recording"],
              ['↘ pop', 'text-sky', "it's transcribing"],
              ['▁ basso', 'text-red', "it couldn't type the text"],
            ].map(([sound, cls, meaning]) => (
              <p class="mt-3 flex items-center gap-3 text-[12px] text-soft">
                <span class={`w-20 ${cls}`}>{sound}</span>
                {meaning}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function PixelBar(handle: Handle<{ filled: number; total?: number; color: string }>) {
  return () => {
    let { filled, total = 24, color } = handle.props
    return (
      <div aria-hidden="true" class="flex gap-[3px]">
        {Array.from({ length: total }, (_, i) => (
          <i class="block h-3 flex-1" style={{ background: i < filled ? color : 'var(--surface0)' }} />
        ))}
      </div>
    )
  }
}

function Numbers() {
  let stats: [string, string, string, number, string][] = [
    ['0 bytes', 'of your audio uploaded', 'Speech and cleanup both run on your Mac.', 0, 'var(--teal)'],
    ['3 models', 'all on-device', 'Silero VAD, Whisper and Qwen3, served from localhost.', 24, 'var(--sky)'],
    ['$0', 'forever', 'No credits, no caps, no "upgrade to keep talking".', 0, 'var(--peach)'],
  ]
  return () => (
    <Section id="numbers" tone="mantle">
      <SectionHead title="Small numbers, on purpose" />
      <div class="grid gap-4 md:grid-cols-3">
        {stats.map(([big, small, body, filled, color]) => (
          <div class="card p-5">
            <p class="font-sans text-[30px] leading-none font-semibold text-text">{big}</p>
            <p class="mt-1.5 text-[12px] text-soft">{small}</p>
            <div class="mt-5">
              <PixelBar filled={filled} color={color} />
            </div>
            <p class="mt-4 text-[12px] text-overlay">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function GetInvolved() {
  let cards: [RemixNode, string, string, string, string][] = [
    [<GitHubIcon />, 'Star on GitHub', 'Follow along, and help other people find it.', 'Open the repo', links.repo],
    ['!', 'Report a problem', 'Something not working? Issues are the fastest way to get it fixed.', 'Open an issue', links.newIssue],
    ['+', 'Contribute', 'Fix bugs, add features, improve the docs. DCO sign-off, no CLA.', 'Read the guide', links.contributing],
    ['♥', 'Read the philosophy', 'Why it exists, and what it must never become.', 'PHILOSOPHY.md', links.philosophy],
  ]
  return () => (
    <Section id="involved">
      <SectionHead title="Get involved" lede="Mockingbird is built in the open. Here's where to start." />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([icon, title, body, cta, href]) => (
          <a href={href} class="card group flex flex-col p-5 transition-colors hover:border-surface2">
            <span aria-hidden="true" class="text-[15px] text-sky">
              {icon}
            </span>
            <span class="mt-3 font-sans text-[15px] font-semibold text-text">{title}</span>
            <span class="mt-1.5 flex-1 text-[12px] text-soft">{body}</span>
            <span class="mt-4 text-[12px] text-sky group-hover:underline">{cta} →</span>
          </a>
        ))}
      </div>
    </Section>
  )
}
