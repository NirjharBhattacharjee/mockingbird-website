import type { Handle, RemixNode } from 'remix/component'

import { ArrowLink, Footer, Nav, Scene, SceneHead, Tabs } from '../ui/layout.tsx'
import { install, links } from '../ui/links.ts'
import { Document } from './document.tsx'
import { CopyButton } from './public/copy-button.tsx'
import { PixelField } from './public/pixel-field.tsx'
import { SectionIndex } from './public/section-index.tsx'
import { TalkDemo } from './public/talk-demo.tsx'
import { Toast } from './public/toast.tsx'
import { TypedText } from './public/typed-text.tsx'

type Vars = Record<string, string>
const delay = (i: number) => ({ '--i': String(i) }) as Vars

// The scenes, in page order. `shape` is what the pixel field draws on each
// scene's stage (see SHAPES in public/lib/shapes.ts).
const SCENES = [
  { id: 'top', label: 'mockingbird', accent: 'var(--sky)' },
  { id: 'about', label: 'No meter', accent: 'var(--mauve)' },
  { id: 'demo', label: 'Hold fn', accent: 'var(--red)' },
  { id: 'how', label: 'Under the hood', accent: 'var(--teal)' },
  { id: 'install', label: 'Install', accent: 'var(--green)' },
  { id: 'local', label: 'Stays local', accent: 'var(--yellow)' },
  { id: 'next', label: "What's next", accent: 'var(--blue)' },
  { id: 'involved', label: 'Get involved', accent: 'var(--peach)' },
]

export function HomePage() {
  return () => (
    <Document>
      <Nav home />
      <PixelField birdSrc="/brand/logo.png" />
      <main>
        <Hero />
        <About />
        <Demo />
        <HowItWorks />
        <Install />
        <StaysLocal />
        <WhatsNext />
        <GetInvolved />
      </main>
      <Footer />
      <Toast />
      <SectionIndex scenes={SCENES} />
    </Document>
  )
}

// ---------------------------------------------------------------------------

function Hero() {
  return () => (
    <section
      id="top"
      data-scene="top"
      class="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 pt-20 pb-36"
    >
      <div class="flex w-full flex-col items-center text-center">
        <a href={links.releases} class="rise border border-sky/40 bg-crust px-3 py-1 text-[14px] text-sky hover:border-sky">
          v0.1.1 is out. See what's new →
        </a>

        <div id="bird-slot" aria-hidden="true" class="mt-8" style={{ width: 'calc(var(--px) * 20)', height: 'calc(var(--px) * 26)' }} />

        <div
          id="wordmark-slot"
          class="mt-3 grid max-w-full place-items-center"
          style={{ width: 'calc(var(--wpx) * 82)', height: 'calc(var(--wpx) * 14)' }}
        >
          <h1>
            <span class="sr-only">mockingbird</span>
            <span aria-hidden="true" class="no-js-only text-5xl font-extrabold text-sky">
              mockingbird
            </span>
          </h1>
        </div>

        <p class="rise mt-6 bg-crust/70 text-[20px] font-bold text-yellow sm:text-[24px]" style={delay(0)}>
          Local voice dictation for macOS
        </p>
        <p class="rise mt-3 max-w-[38rem] bg-crust/70 text-[17px] text-soft" style={delay(1)}>
          Hold Fn, speak, let go. Clean text lands at your cursor.
          <br class="hidden sm:block" /> Free forever, and your voice never leaves your Mac.
        </p>
        <div class="rise mt-8 flex flex-wrap justify-center gap-3" style={delay(2)}>
          <a href="#install" class="btn-primary">
            <span aria-hidden="true">↓</span> Get mockingbird
          </a>
          <a href="#demo" class="btn-ghost">
            <span aria-hidden="true">▶</span> See it in action
          </a>
        </div>
      </div>
      <p class="rise absolute bottom-24 hidden bg-crust/70 text-[14px] text-overlay md:block" style={delay(4)}>
        Scroll or press <kbd class="kbd">↓</kbd> <span class="nudge" aria-hidden="true">↓</span>
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------

function About() {
  return () => (
    <Scene id="about" shape="bird">
      <SceneHead title={<>Your words aren't <TypedText phrases={['metered.', 'uploaded.', 'stored.', 'for sale.']} /></>} />
      <div class="space-y-4 text-soft">
        <p>
          Cloud dictation is good software with a meter on it: a credit cap that runs out and reminds you,
          mid-sentence, that your own words are being counted. Mockingbird has no meter.
        </p>
        <p>
          A capable speech model, a small language model for cleanup, and a hotkey. That's all dictation needs, and all
          of it runs on your Mac. No account, no cloud, no usage limits.
        </p>
      </div>
      <figure class="mt-7 border-l-[3px] border-mauve pl-5">
        <blockquote class="text-[18px] leading-snug font-bold text-text">
          A tool this useful gatekept behind a credit meter isn't a technical necessity, it's a business model choice, and
          this project is the alternative to that choice.
        </blockquote>
        <figcaption class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-overlay">
          <span>Nirjhar Bhattacharjee, creator of mockingbird</span>
          <ArrowLink href={links.philosophy}>Read the philosophy</ArrowLink>
        </figcaption>
      </figure>
    </Scene>
  )
}

// ---------------------------------------------------------------------------

function Demo() {
  let steps: [string, RemixNode][] = [
    ['Hold Fn', <>Anywhere: Slack, Mail, your editor, a browser tab. A rising <em class="text-green not-italic">tink</em> means it's listening.</>],
    ['Speak', <>Ramble a little. Pauses, "um"s and restarts get cleaned up. Double-tap Fn for hands-free.</>],
    ['Let go', <>A falling <em class="text-sky not-italic">pop</em>, and a tidy sentence is typed where your cursor is.</>],
  ]
  return () => (
    <Scene id="demo" shape="fn" flip>
      <SceneHead
        title="Hold fn. Speak. Let go."
        lede={<>Run <code class="text-sky">mockingbird start</code> once. After that it's just a key, in every app, at every login.</>}
      />
      <TalkDemo />
      <ol class="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map(([title, body], i) => (
          <li>
            <p class="text-[16px] font-extrabold text-text">
              <span class="text-overlay">{i + 1}.</span> {title}
            </p>
            <p class="mt-1 text-[14px] text-soft">{body}</p>
          </li>
        ))}
      </ol>
    </Scene>
  )
}

// ---------------------------------------------------------------------------

function Spec(handle: Handle<{ rows: [string, string][] }>) {
  return () => (
    <dl class="mt-5 grid grid-cols-[8.5rem_1fr] gap-x-4 gap-y-1.5 border-t border-surface0 pt-4 text-[14px]">
      {handle.props.rows.map(([k, v]) => (
        <>
          <dt class="text-overlay">{k}</dt>
          <dd class="text-text">{v}</dd>
        </>
      ))}
    </dl>
  )
}

function HowItWorks() {
  return () => (
    <Scene id="how" shape="pipeline">
      <SceneHead title="Three models, one key" lede="Each model does the one job it's best at, and all of them are served from 127.0.0.1." />
      <Tabs
        name="how"
        label="Pipeline stage"
        tabs={[
          {
            label: 'Listen',
            color: 'var(--teal)',
            body: (
              <>
                <p class="text-soft">
                  While mockingbird runs, the microphone feeds a 30-second ring buffer held in memory. When you press Fn,
                  capture starts 300 ms before the key registers, so the first syllable isn't clipped. Silero VAD then
                  trims the silence around your speech.
                </p>
                <Spec rows={[['Model', 'Silero VAD'], ['Window', '32 ms (512 samples)'], ['Pre-roll', '300 ms'], ['Kept on disk', 'nothing']]} />
              </>
            ),
          },
          {
            label: 'Hear',
            color: 'var(--sky)',
            body: (
              <>
                <p class="text-soft">
                  When you let go, the clip goes to whisper.cpp on your Mac. Whisper large-v3 turns it into words. It's
                  slower than turbo, but it gets names right, so it's the default.
                </p>
                <Spec rows={[['Model', 'Whisper large-v3, Q5_0'], ['Size', '1.08 GB'], ['Served by', 'whisper-server on :8771']]} />
              </>
            ),
          },
          {
            label: 'Tidy',
            color: 'var(--mauve)',
            body: (
              <>
                <p class="text-soft">
                  A small local model fixes punctuation, drops the "um"s and turns spoken lists into lists. Short,
                  confident phrases like "yes please" skip it entirely, so they don't wait.
                </p>
                <Spec rows={[['Model', 'Qwen3-4B-Instruct, Q4'], ['Served by', 'Ollama on :8772'], ['Skipped for', '4 words or fewer, said clearly']]} />
              </>
            ),
          },
          {
            label: 'Type',
            color: 'var(--peach)',
            body: (
              <>
                <p class="text-soft">
                  The cleanup is typed while the model is still writing it, as key events into the app in front. Your
                  clipboard is never touched, and a line break can't send a message by itself.
                </p>
                <Spec rows={[['First words', 'after 240 ms (median, M3)'], ['Whole cleanup', '626 ms (median, M3)'], ['Uses', 'key events, not the clipboard']]} />
              </>
            ),
          },
        ]}
      />
      <p class="mt-6">
        <ArrowLink href={links.architecture}>Read the architecture</ArrowLink>
      </p>
    </Scene>
  )
}

// ---------------------------------------------------------------------------

function Command(handle: Handle<{ command: string; foot: RemixNode }>) {
  return () => {
    let { command, foot } = handle.props
    return (
      <>
        <pre class="overflow-x-auto border border-surface0 bg-crust px-4 py-3 text-[14px] text-text">
          <span class="text-green">$ </span>
          {command}
        </pre>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <CopyButton text={command} label="Copy command" />
          <span class="text-[14px] text-overlay">{foot}</span>
        </div>
      </>
    )
  }
}

function Install() {
  let commands: [string, string][] = [
    ['mockingbird start', 'Run in the background, now and at every login'],
    ['mockingbird stop', 'Stop, and stay stopped across reboots'],
    ['mockingbird restart', 'Restart (do this after granting a permission)'],
    ['mockingbird status', "Whether it's running, and which permissions it has"],
    ['mockingbird listen', 'Dictate live in a terminal, with a level meter'],
    ['mockingbird transcribe <file>', 'Turn a recording (mp3, m4a, wav…) into text'],
    ['mockingbird fn', 'Bind Fn to dictation, so it stops opening the emoji picker'],
  ]
  return () => (
    <Scene id="install" shape="terminal" flip>
      <SceneHead title="Install mockingbird" lede="You need a Mac with Apple Silicon, Homebrew, and about 6 GB free for the models." />
      <Tabs
        name="install"
        label="Install method"
        tabs={[
          {
            label: 'Homebrew',
            body: (
              <>
                <p class="mb-4 text-soft">
                  Install it, then fetch the models once with <code class="text-sky">{install.pull}</code>.
                </p>
                <Command command={install.brew} foot="Update with brew upgrade mockingbird." />
              </>
            ),
          },
          {
            label: 'Install script',
            body: (
              <>
                <p class="mb-4 text-soft">Installs mockingbird and pulls the models in one go.</p>
                <Command command={install.script} foot="Safe to run again. Run it again to update." />
              </>
            ),
          },
          {
            label: 'Commands',
            body: (
              <table class="w-full text-left text-[14px]">
                <tbody>
                  {commands.map(([cmd, does]) => (
                    <tr class="border-b border-surface0 last:border-0">
                      <td class="py-2 pr-4 align-top whitespace-nowrap text-sky">{cmd}</td>
                      <td class="py-2 text-soft">{does}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          },
          {
            label: 'Keys & sounds',
            body: (
              <div class="space-y-3 text-[15px] text-soft">
                <p class="flex items-center gap-3">
                  <kbd class="kbd">fn</kbd> hold: record while held
                </p>
                <p class="flex items-center gap-3">
                  <span class="flex gap-1">
                    <kbd class="kbd">fn</kbd>
                    <kbd class="kbd">fn</kbd>
                  </span>
                  double-tap: hands-free until the next Fn
                </p>
                {[
                  ['↗ tink', 'text-green', "it's recording"],
                  ['↘ pop', 'text-sky', "it's transcribing"],
                  ['▁ basso', 'text-red', "it couldn't type the text"],
                ].map(([sound, cls, meaning]) => (
                  <p class="flex items-center gap-3">
                    <span class={`w-24 ${cls}`}>{sound}</span>
                    {meaning}
                  </p>
                ))}
              </div>
            ),
          },
        ]}
      />
      <p class="mt-6 text-[14px] leading-loose text-soft">
        Then run <code class="text-sky">mockingbird start</code>. The first time, macOS asks for{' '}
        <span class="border border-teal/40 px-1.5 text-teal">Microphone</span>{' '}
        <span class="border border-sky/40 px-1.5 text-sky">Accessibility</span>{' '}
        <span class="border border-mauve/40 px-1.5 text-mauve">Input Monitoring</span>, then{' '}
        <code class="text-sky">mockingbird restart</code>. <ArrowLink href={links.manualInstall}>Install by hand</ArrowLink>
      </p>
    </Scene>
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

function StaysLocal() {
  let stats: [string, string, string, number, string][] = [
    ['0 bytes', 'of your audio uploaded', 'Speech and cleanup both run on your Mac.', 0, 'var(--teal)'],
    ['3 models', 'all on-device', 'Silero VAD, Whisper and Qwen3, served from localhost.', 24, 'var(--sky)'],
    ['$0', 'forever', 'No credits, no caps, no "upgrade to keep talking".', 0, 'var(--peach)'],
  ]
  return () => (
    <Scene id="local" shape="lock">
      <SceneHead
        title="Small numbers, on purpose"
        lede="The only network call mockingbird makes is the model download you run yourself."
      />
      <div class="space-y-6">
        {stats.map(([big, small, body, filled, color]) => (
          <div>
            <p class="flex flex-wrap items-baseline gap-x-3">
              <span class="text-[30px] leading-none font-extrabold text-text">{big}</span>
              <span class="text-soft">{small}</span>
            </p>
            <div class="mt-3">
              <PixelBar filled={filled} color={color} />
            </div>
            <p class="mt-2 text-[14px] text-overlay">{body}</p>
          </div>
        ))}
      </div>
      <p class="mt-7">
        <ArrowLink href={links.privacy}>What it touches, and what it never does</ArrowLink>
      </p>
    </Scene>
  )
}

// ---------------------------------------------------------------------------

// Open issues on GitHub, grouped by what they change. Update this list when
// issues open or close.
const ROADMAP: [string, string, [number, string][]][] = [
  [
    'Faster',
    'var(--sky)',
    [
      [56, 'Measure Moonshine Streaming against Whisper'],
      [57, 'Transcribe while you speak, so letting go of Fn barely waits'],
      [58, 'Retune the cleanup prompt for a smaller default model'],
      [59, 'Bench the whole trip: your audio through both models'],
      [64, 'Ship 43 MB of the ONNX runtime instead of 287 MB'],
    ],
  ],
  [
    'Smarter cleanup',
    'var(--mauve)',
    [
      [62, 'Learn dictionary words from your own corrections'],
      [61, 'Move the dictionary into SQLite'],
      [35, 'Keep the cleanup rules in a Markdown file you can edit'],
      [51, 'Pick the cleanup model from the Ollama models you have'],
      [60, 'Let model settings reach the background agent'],
    ],
  ],
  [
    'Easier install',
    'var(--green)',
    [
      [52, "Offer to install Homebrew when it's missing"],
      [48, 'Live download progress bars instead of a clock'],
      [49, 'Draw the install with the Bubble Tea UI'],
      [30, 'A guided install for MacBooks'],
      [55, 'mockingbird uninstall: remove everything an install added'],
    ],
  ],
  [
    'First run',
    'var(--peach)',
    [
      [54, 'Walk through permissions, Fn and a test dictation'],
      [50, 'A home screen with every command when you type mockingbird'],
      [36, 'Show the logo in macOS permission lists'],
    ],
  ],
  [
    'Typing fixes',
    'var(--red)',
    [
      [32, 'Google Docs in Chrome only gets the first characters'],
      [31, 'Double-tapping Fn opens the emoji picker'],
      [33, 'Lists lose their line breaks in Mail and WhatsApp'],
      [34, 'A dictated list starts on the same line as the text before it'],
      [63, 'mockingbird: command not found after the curl install'],
      [29, 'The curl installer fails on a MacBook Air M2'],
    ],
  ],
]

function WhatsNext() {
  return () => (
    <Scene id="next" shape="road" flip>
      <SceneHead
        title="What's next"
        lede="The open issues on GitHub, grouped by what they change. Each one is a good place to start."
      />
      <Tabs
        name="next"
        label="Area"
        tabs={ROADMAP.map(([label, color, items]) => ({
          label,
          color,
          body: (
            <ul class="divide-y divide-surface0">
              {items.map(([n, title]) => (
                <li>
                  <a href={links.issue(n)} class="group flex gap-4 py-2.5 text-[15px]">
                    <span class="w-10 shrink-0 text-overlay group-hover:text-text">#{n}</span>
                    <span class="text-soft group-hover:text-text group-hover:underline">{title}</span>
                  </a>
                </li>
              ))}
            </ul>
          ),
        }))}
      />
      <p class="mt-6">
        <ArrowLink href={links.issues}>All open issues</ArrowLink>
      </p>
    </Scene>
  )
}

// ---------------------------------------------------------------------------

function GetInvolved() {
  // Nerd Font icons: GitHub, bug, code fork, heart
  let rows: [string, string, string, string, string][] = [
    ['\uf09b', 'Star on GitHub', 'Follow along, and help other people find it.', 'Open the repo', links.repo],
    ['\uf188', 'Report a problem', 'Something not working? Issues are the fastest way to get it fixed.', 'Open an issue', links.newIssue],
    ['\uf126', 'Contribute', 'Fix bugs, add features, improve the docs. DCO sign-off, no CLA.', 'Read the guide', links.contributing],
    ['\uf004', 'Read the philosophy', 'Why it exists, and what it must never become.', 'Philosophy', links.philosophy],
  ]
  return () => (
    <Scene id="involved" shape="heart">
      <SceneHead title="Get involved" lede="Mockingbird is built in the open. Here's where to start." />
      <ul class="divide-y divide-surface0 border-y border-surface0">
        {rows.map(([icon, title, body, cta, href]) => (
          <li>
            <a href={href} class="group flex gap-4 py-4">
              <span aria-hidden="true" class="mt-0.5 w-5 shrink-0 text-sky">
                {icon}
              </span>
              <span class="flex-1">
                <span class="block font-extrabold text-text">{title}</span>
                <span class="block text-[14px] text-soft">{body}</span>
              </span>
              <span class="hidden self-center text-[14px] text-sky group-hover:underline sm:block">{cta} →</span>
            </a>
          </li>
        ))}
      </ul>
    </Scene>
  )
}
