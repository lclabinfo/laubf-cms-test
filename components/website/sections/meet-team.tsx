"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"

function displayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0] ?? ""
  const first = parts[0]
  const lastInitial = (parts[parts.length - 1] ?? "").charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}

interface TeamMember {
  name: string
  role?: string
  bio?: string
  image?: { src: string; alt: string }
}

interface MeetTeamContent {
  overline?: string
  heading: string
  members: TeamMember[]
}

interface Props {
  content: MeetTeamContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function MeetTeamSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme}>
      {/* Header — centered */}
      <div className={cn("flex flex-col items-center text-center mb-12 lg:mb-16", animate && "animate-hero-fade-up")}>
        {content.overline && (
          <p className={`text-h4 font-normal ${t.textMuted} mb-3`}>
            {content.overline}
          </p>
        )}
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
      </div>

      {/* Team member cards — centered */}
      <div className="flex flex-wrap justify-center gap-6">
        {content.members.map((member, i) => (
          <div key={i} className={cn("flex flex-col w-full max-w-[280px]", animate && "animate-hero-fade-up-delayed")}>
            {/* Photo */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-white-2 to-white-1-5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-16 rounded-full bg-white-2-5/60 flex items-center justify-center">
                  <svg className="size-8 text-black-3/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Name — first name + last initial only */}
            <h3 className={`text-h3 ${t.textPrimary}`}>
              {displayName(member.name)}
            </h3>

            {/* Role */}
            {member.role && (
              <p className={`text-h4 font-normal ${t.textMuted} mt-1`}>
                {member.role}
              </p>
            )}

            {/* Biography */}
            {member.bio && (
              <p className={`text-body-1 ${t.textMuted} mt-2`}>
                {member.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}
