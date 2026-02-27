'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function WebsiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Website Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-4 text-muted-foreground">
          We&apos;re sorry, but this page couldn&apos;t be loaded. Please try again.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
