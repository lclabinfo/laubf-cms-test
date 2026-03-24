import { Toaster } from "sonner"

export default function BuilderEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {children}
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
