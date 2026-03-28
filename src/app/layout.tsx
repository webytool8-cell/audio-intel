import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Audio Intel — Trending Audio Intelligence',
  description:
    'Real-time intelligence on trending audio. Discover what sounds are growing, match them to your clips, and generate ready-to-post content.',
  keywords: ['trending audio', 'short form content', 'tiktok sounds', 'viral audio', 'audio trends', 'clip matcher'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] antialiased">
        {/* Top nav bar */}
        <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-[#00ff88] flex items-center justify-center">
                <span className="text-[#0a0a0a] text-xs font-black leading-none">AI</span>
              </div>
              <span className="font-bold text-sm tracking-tight">
                Audio<span className="text-[#00ff88]">Intel</span>
              </span>
            </a>
            <nav className="flex items-center gap-1">
              <a
                href="/"
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#555] hover:text-[#888] hover:bg-[#111] transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/match"
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#555] hover:text-[#888] hover:bg-[#111] transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                Clip Matcher
              </a>
            </nav>
            <div className="flex items-center gap-4 text-xs text-[#444] font-mono ml-2">
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                Live
              </span>
              <span className="hidden sm:block">v0.2.0</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          {children}
        </main>

        <footer className="border-t border-[#111] py-8 text-center">
          <p className="text-xs text-[#333] font-mono">
            Audio Intel — Signal, not storage. All rights belong to original creators.
          </p>
        </footer>
      </body>
    </html>
  );
}
