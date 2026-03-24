import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

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

  return <>{children}</>
}
