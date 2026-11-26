import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AudioLines, History, Languages, Mic, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { HeroVisual } from '../components/landing/HeroVisual';
import { Wordmark } from '../components/brand/BrandMark';

const features = [
  {
    icon: Mic,
    title: 'You talk. It writes it down.',
    body: 'Speech is transcribed in the language you picked, including Hindi, Telugu, Tamil, and Kannada.',
  },
  {
    icon: AudioLines,
    title: 'The reply comes back as voice.',
    body: 'Five voices, each with its own pace. Preview them before you settle on one.',
  },
  {
    icon: History,
    title: 'The thread stays put.',
    body: 'Earlier turns stay with the conversation, so you can leave and pick it up later.',
  },
  {
    icon: ShieldCheck,
    title: 'The recording is for that turn.',
    body: 'Audio is used to transcribe and then dropped. What remains is the text of the conversation.',
  },
];

const steps = [
  { n: '1', title: 'Say it, or type it', body: 'Tap the microphone for a spoken turn, or send a line of text if you would rather not talk.' },
  { n: '2', title: 'Tara answers in that language', body: 'The reply follows the language of the session, using the voice you chose in settings.' },
  { n: '3', title: 'Come back to it', body: 'History keeps the transcript. You can rename a thread, replay a reply, or continue it.' },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
        <div className="rise space-y-6 lg:col-span-7">
          <p className="text-sm font-semibold tracking-wide text-accent">A conversation, not a dashboard of features</p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Speak. Hear the answer.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-mute">
            Tara listens, replies out loud, and keeps the thread on your account. Seventeen languages. Five voices. No extra ceremony.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to="/assistant" className="btn btn-primary">
              <Mic className="h-4 w-4" strokeWidth={1.75} />
              Start talking
            </Link>
            <a href="#how" className="btn btn-quiet">
              How a turn works
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </a>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-mute">
            <li className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-accent" strokeWidth={1.75} />
              17 languages
            </li>
            <li className="flex items-center gap-2">
              <AudioLines className="h-4 w-4 text-accent" strokeWidth={1.75} />
              Live waveform while you speak
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.75} />
              Audio is not kept
            </li>
          </ul>
        </div>
        <div className="lg:col-span-5">
          <HeroVisual />
        </div>
      </section>

      <section id="product" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">What you actually get</h2>
            <p className="mt-3 text-lg text-mute">Four things the product does. The rest is settings.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className={`card rise rise-d${Math.min(index + 1, 3)} p-5`}>
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-line bg-panel">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">One turn, then the next</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="space-y-2">
                <span className="font-display text-3xl text-accent">{step.n}</span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-mute">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="privacy" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Your account, your threads.</h2>
            <p className="mt-3 text-lg text-mute">
              Sign-in is a normal session. Conversations belong to that account, and another person cannot open them.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <h3 className="font-semibold">Short-lived sign-in</h3>
              <p className="mt-1 text-sm leading-relaxed text-mute">Access lasts 15 minutes. Signing out ends the session on this device.</p>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <h3 className="font-semibold">No leftover audio</h3>
              <p className="mt-1 text-sm leading-relaxed text-mute">The recording exists long enough to transcribe the turn. The saved record is text.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Ready when you are.</h2>
            <p className="mt-2 text-mute">The demo account is there if you want to look around first.</p>
          </div>
          <Link to="/register" className="btn btn-primary">
            Create a free account
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-mute sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Wordmark to="/" />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-5">
            <a href="#product" className="hover:text-ink">Product</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#privacy" className="hover:text-ink">Privacy</a>
            <Link to="/login" className="hover:text-ink">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
