"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { BuilderShell } from "@/components/cms/website/builder/builder-shell"

const DynamicBuilderShell = dynamic(
  () => import("@/components/cms/website/builder/builder-shell").then((m) => m.BuilderShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
  },
)

export function LazyBuilderShell(props: ComponentProps<typeof BuilderShell>) {
  return <DynamicBuilderShell {...props} />
}
