import Link from 'next/link'
import { resolveHref } from '@/lib/website/resolve-href'

export default function WebsiteNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <p
          className="text-[8rem] leading-none font-bold tracking-tighter text-black-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          404
        </p>

        <h1
          className="mt-4 text-3xl font-bold tracking-tight text-black-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Page not found
        </h1>

        <p className="mt-4 text-lg text-black-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={resolveHref('/')}
            className="inline-flex items-center justify-center rounded-full bg-black-1 px-8 py-4 text-button-1 text-white-1 transition-all duration-300 hover:brightness-[1.15]"
          >
            Go Home
          </Link>
          <Link
            href={resolveHref('/messages')}
            className="inline-flex items-center justify-center rounded-full border border-black-1 bg-transparent px-8 py-4 text-button-1 text-black-1 transition-all duration-300 hover:bg-black-1/[0.06]"
          >
            Browse Messages
          </Link>
        </div>
      </div>
    </div>
  )
}
