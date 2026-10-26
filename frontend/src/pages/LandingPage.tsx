import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { HeroVisual } from '../components/landing/HeroVisual';
import {
  Mic,
  Sparkles,
  Zap,
  Shield,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Headphones,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080C14] light:bg-slate-50 text-slate-100 light:text-slate-900 flex flex-col transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[280px] bg-indigo-600/25 blur-3xl pointer-events-none rounded-full animate-drift" />
        <div className="absolute top-1/3 right-0 w-[360px] h-[260px] bg-cyan-500/20 blur-3xl pointer-events-none rounded-full animate-drift" style={{ animationDelay: '-4s' }} />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left rise-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 light:border-indigo-200 bg-indigo-500/10 light:bg-indigo-50 px-3 py-1 text-xs font-medium text-cyan-300 light:text-indigo-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Voice AI • 14+ Languages • Cute Voice Personas</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white light:text-slate-900 leading-[1.1] text-balance">
                Your Voice. <br />
                Your AI. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 light:from-indigo-600 light:via-cyan-600 light:to-purple-600">
                  Your World.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 light:text-slate-600 max-w-2xl leading-relaxed">
                Step into a fluid conversational experience where speaking with AI feels as natural and cheerful as talking to a friend. Powered by multilingual neural STT, deep reasoning, and charming acoustic personas with pitch adjustments.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-cyan-400 active:scale-95 transition-all whitespace-nowrap"
                >
                  <Mic className="h-4 w-4" />
                  <span>Start Talking</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 light:border-slate-300 bg-slate-900/80 light:bg-white px-6 py-3.5 text-sm font-semibold text-slate-200 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 active:scale-95 transition-all whitespace-nowrap shadow-sm"
                >
                  <span>Explore Features</span>
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 light:border-slate-200 text-xs text-slate-400 light:text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                  <span>&lt;200ms Turn Latency</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                  <span>14+ Languages</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                  <span>Cute Female & Male Voices</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative rise-in rise-delay-2">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-slate-800/80 light:border-slate-200 bg-slate-950/40 light:bg-slate-100/60 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
              Engineered for Conversational Velocity
            </h2>
            <p className="text-sm sm:text-base text-slate-400 light:text-slate-600">
              Every stage of the VoxAI pipeline is calibrated for low-latency voice turnarounds and cheerful, natural dialogue rhythm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-6 hover:border-indigo-500/30 light:hover:border-indigo-400 transition-all shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 light:bg-cyan-50 text-cyan-400 light:text-cyan-600 flex items-center justify-center mb-4 border border-cyan-500/20 light:border-cyan-200">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white light:text-slate-900 mb-2">01. Neural STT & Languages</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Verbatim speech transcription across 14 languages including English, Spanish, Japanese, Korean, French, German, and Hindi.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-6 hover:border-indigo-500/30 light:hover:border-indigo-400 transition-all shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 light:bg-indigo-50 text-indigo-400 light:text-indigo-600 flex items-center justify-center mb-4 border border-indigo-500/20 light:border-indigo-200">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white light:text-slate-900 mb-2">02. Contextual AI Reasoning</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Understands conversation nuance, responds in your preferred language, and preserves session memory across multi-turn exchanges.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-6 hover:border-indigo-500/30 light:hover:border-indigo-400 transition-all shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 light:bg-purple-50 text-purple-400 light:text-purple-600 flex items-center justify-center mb-4 border border-purple-500/20 light:border-purple-200">
                <Headphones className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white light:text-slate-900 mb-2">03. Cute Personas (M & F)</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Choose between cheerful female (Kore, Charon) and playful male (Puck, Zephyr) personas with instant pitch control.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-white p-6 hover:border-indigo-500/30 light:hover:border-indigo-400 transition-all shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-600 flex items-center justify-center mb-4 border border-emerald-500/20 light:border-emerald-200">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white light:text-slate-900 mb-2">04. Privacy & Dark/Light Mode</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Strict data isolation, ephemeral processing, zero audio retention, and a full dark/light aesthetic switch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 light:border-slate-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
              The Three-Step Voice Loop
            </h2>
            <p className="text-sm sm:text-base text-slate-400 light:text-slate-600">
              From the moment you speak to the synthesized response playing in your ears.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-3 shadow-sm">
              <div className="text-2xl font-mono font-bold text-cyan-400 light:text-cyan-600">01.</div>
              <h3 className="text-base font-semibold text-white light:text-slate-900">Speak Naturally</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                The MediaRecorder API and Web Audio analyser capture acoustic samples directly from your microphone with echo cancellation in your selected language.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-3 shadow-sm">
              <div className="text-2xl font-mono font-bold text-indigo-400 light:text-indigo-600">02.</div>
              <h3 className="text-base font-semibold text-white light:text-slate-900">Multilingual Processing</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                FastAPI and Express dispatch audio to speech transcription models. The transcribed text joins prior thread context in the LLM conversational engine.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-6 space-y-3 shadow-sm">
              <div className="text-2xl font-mono font-bold text-purple-400 light:text-purple-600">03.</div>
              <h3 className="text-base font-semibold text-white light:text-slate-900">Cute Voice Playback</h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                The response is synthesized into high-sample rate audio using your chosen voice persona and pitch, accompanied by real-time animated waveform visualizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack & Architecture Section */}
      <section id="architecture" className="py-20 border-t border-slate-800/80 light:border-slate-200 bg-slate-950/30 light:bg-slate-100/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 light:text-indigo-600">
                <Layers className="h-3.5 w-3.5" />
                <span>AI Full-Stack Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
                Modern Cloud-Native Tech Stack
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 leading-relaxed">
                VoxAI is built on production-grade standards. Fully compatible with both Python FastAPI + PostgreSQL/Alembic and high-concurrency Node.js Express full-stack runtimes.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-300 light:text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span><strong>Frontend:</strong> React 19, TypeScript, Tailwind CSS, Web Audio API, Canvas Analyser</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span><strong>Backend:</strong> FastAPI / Express with JWT, Bcrypt, Multer & Secure Sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-purple-400" />
                  <span><strong>AI Pipeline:</strong> Gemini 3.5 Transcribe, Gemini 3.8 Flash, Multi-Voice TTS Engine</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-slate-800 light:border-slate-300 bg-[#060910] p-6 shadow-xl font-mono text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-400">
                <span className="text-[11px]">voxai-pipeline.json</span>
                <span className="text-[10px] text-cyan-400 font-semibold">ACTIVE RUNTIME</span>
              </div>
              <pre className="overflow-x-auto text-[11px] text-slate-300 leading-relaxed">
{`{
  "voice_turn_pipeline": {
    "default_language": "en-US",
    "supported_languages": 14,
    "voice_personas": ["Kore", "Charon", "Puck", "Zephyr", "Fenrir"],
    "voice_styles": ["cute", "warm", "cheerful", "calm"],
    "latency_target_ms": 180,
    "theme_modes": ["dark", "light"]
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 border-t border-slate-800/80 light:border-slate-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 light:text-emerald-600">
              <Lock className="h-3.5 w-3.5" />
              <span>Enterprise Grade Security</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
              Privacy First by Design
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600">
              We never train on your private conversation audio. Sessions are strictly scoped to your verified account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 light:text-slate-700">
            <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-5 space-y-2 shadow-sm">
              <h4 className="font-semibold text-white light:text-slate-900 text-sm">Ephemeral Audio Streams</h4>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed">
                Raw audio buffers are decoded in memory and discarded immediately after transcription. No voice files linger on servers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-5 space-y-2 shadow-sm">
              <h4 className="font-semibold text-white light:text-slate-900 text-sm">Cryptographic Identity</h4>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed">
                Access tokens expire in 15 minutes. Revocable refresh sessions allow remote logout and credential invalidation at any time.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white p-5 space-y-2 shadow-sm">
              <h4 className="font-semibold text-white light:text-slate-900 text-sm">Hardened Permissions</h4>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed">
                Conversation CRUD operations strictly enforce database-level user ownership checks. Cross-tenant leakage is impossible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 border-t border-slate-800/80 light:border-slate-200 bg-gradient-to-b from-indigo-950/20 light:from-indigo-50 to-transparent">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white light:text-slate-900">
            Ready to experience natural AI voice?
          </h2>
          <p className="text-sm text-slate-300 light:text-slate-600 max-w-xl mx-auto">
            Join developers, leaders, and curious thinkers conversing in 14+ languages with VoxAI's cute voice personas.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-cyan-400 active:scale-95 transition-all"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 light:border-slate-200 py-8 bg-[#060910] light:bg-white transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 light:text-slate-600">
          <p>&copy; {new Date().getFullYear()} VoxAI..</p>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-300 light:hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-300 light:hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#security" className="hover:text-slate-300 light:hover:text-slate-900 transition-colors">Security</a>
            <Link to="/login" className="hover:text-slate-300 light:hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
