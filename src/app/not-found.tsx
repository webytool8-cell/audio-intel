import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="pt-20 text-center">
      <p className="font-mono text-[#333] text-6xl font-bold mb-4">404</p>
      <p className="text-[#555] text-sm mb-6">Page not found.</p>
      <Link
        href="/"
        className="text-[#00ff88] text-sm font-mono hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
