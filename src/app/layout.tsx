import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Audio Intel — Trending Audio Dashboard',
  description:
    'Real-time intelligence on trending audio used in short-form content. Discover what sounds are growing, where they are being used, and how fast.',
  keywords: ['trending audio', 'short form content', 'tiktok sounds', 'viral audio', 'audio trends'],
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
            <div className="flex items-center gap-4 text-xs text-[#444] font-mono">
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                Live
              </span>
              <span className="hidden sm:block">v0.1.0</span>
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
