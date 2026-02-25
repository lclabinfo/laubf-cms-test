"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import CTAButton from "@/components/website/shared/cta-button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ExternalLink, Mail, Instagram, Facebook, Globe } from "lucide-react"

function getSocialIcon(platform: string) {
  const p = platform.toLowerCase()
  if (p === "email" || p === "mail") return Mail
  if (p === "instagram") return Instagram
  if (p === "facebook") return Facebook
  if (p === "website") return Globe
  return null
}

interface MinistryHeroContent {
  overline?: string
  heading: string
  headingStyle?: "display" | "sans"
  ctaButton?: { label: string; href: string; visible: boolean }
  socialLinks?: { platform: string; href: string }[]
  heroImage?: { src: string; alt: string; objectPosition?: string }
}

interface Props {
  content: MinistryHeroContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function MinistryHeroSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false
  const isSans = content.headingStyle === "sans"

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth} className="pt-[104px] !pb-0">
      <div className={cn("container-standard flex flex-col items-center text-center mb-10 lg:mb-14", animate && "animate-hero-fade-up")}>
        {content.overline && (
          <p className={`${isSans ? "text-h4 font-normal" : "text-overline"} ${t.textMuted} mb-4`}>{content.overline}</p>
        )}

        <h1 className={`${isSans ? "text-h1" : "text-hero-accent"} ${t.textPrimary}`}>
          {content.heading.split("\n").map((line, i) => (
            <span key={i}>{i > 0 && <br />}{line}</span>
          ))}
        </h1>

        {(content.ctaButton?.visible || content.socialLinks) && (
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
            {content.ctaButton?.visible && (
              <CTAButton
                label={content.ctaButton.label}
                href={content.ctaButton.href}
                variant={isSans ? "campus" : "primary"}
                size="small"
                theme="light"
                icon={<ExternalLink className="size-6" />}
                target={content.ctaButton.href.startsWith("http") ? "_blank" : undefined}
                rel={content.ctaButton.href.startsWith("http") ? "noopener noreferrer" : undefined}
              />
            )}
            {content.socialLinks && content.socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {content.socialLinks.map((link, i) => {
                  const SocialIcon = getSocialIcon(link.platform)
                  return (
                    <a
                      key={i}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${isSans ? "px-3 py-3 rounded-lg bg-white-2 hover:bg-white-2-5" : "w-9 h-9 rounded-full border " + t.borderSubtle} flex items-center justify-center ${t.textMuted} transition-colors`}
                      aria-label={link.platform}
                    >
                      {SocialIcon ? <SocialIcon className="size-6 text-black-2" /> : <span className="text-body-1">{link.platform[0]?.toUpperCase()}</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {content.heroImage && (
        <div className={cn("container-standard pb-0", animate && "animate-hero-fade-up-delayed")}>
          <div className={`relative w-full ${isSans ? "h-[320px] lg:h-[480px] rounded-xl" : "aspect-[16/7] rounded-2xl"} overflow-hidden bg-gradient-to-br from-white-2 to-white-1-5`}>
            {content.heroImage.src && (
              <Image src={content.heroImage.src} alt={content.heroImage.alt} fill className="object-cover" style={{ objectPosition: content.heroImage?.objectPosition }} />
            )}
          </div>
        </div>
      )}
    </SectionContainer>
  )
}
