import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Toaster } from "sonner"

export default async function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/cms/login")
  }

  if (!session.churchId) {
    redirect("/cms/no-access")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {children}
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
