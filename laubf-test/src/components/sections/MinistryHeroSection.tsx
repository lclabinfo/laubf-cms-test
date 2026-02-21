/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline?: string -- small label above heading (e.g. "MINISTRY")
 *   heading: string -- large display heading (e.g. "Adult", "Children")
 *   headingStyle?: "display" | "sans" -- "display" = serif italic (default for age-group pages), "sans" = Helvetica (campus pages)
 * -- Buttons (BASIC) --
 *   ctaButton?: { label, href, visible }
 *   socialLinks?: { platform, href }[] -- social media icon links
 * -- Media (BASIC) --
 *   heroImage?: { src, alt } -- full-width landscape image below heading
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle entry animations
 *     Animations: heading + CTA fade up on page load, hero image scales in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: ministry_hero_sections (id, overline, heading, heading_style, cta_label, cta_href, cta_visible, hero_image_src, hero_image_alt, visible, color_scheme)
 * DB SCHEMA: ministry_hero_social_links (id, section_id, platform, href, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import { themeTokens } from "@/lib/theme";
import type { MinistryHeroSectionProps } from "@/lib/types/sections";
import CTAButton from "@/components/shared/CTAButton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Mail, Instagram, Facebook, Globe } from "lucide-react";

function getSocialIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === "email" || p === "mail") return Mail;
  if (p === "instagram") return Instagram;
  if (p === "facebook") return Facebook;
  if (p === "website") return Globe;
  return null;
}

export default function MinistryHeroSection(props: {
  settings: MinistryHeroSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;
  const isSans = content.headingStyle === "sans";

  return (
    <SectionContainer settings={settings} className="pt-[104px] !pb-0">
      {/* Centered text content */}
      <div className={cn("container-standard flex flex-col items-center text-center mb-10 lg:mb-14", animate && "animate-hero-fade-up")}>
        {content.overline && (
          <p className={`${isSans ? "text-h4 font-normal" : "text-overline"} ${t.textMuted} mb-4`}>
            {content.overline}
          </p>
        )}

        <h1 className={`${isSans ? "text-h1" : "text-hero-accent"} ${t.textPrimary}`}>
          {content.heading.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>

        {/* CTA button + social icons */}
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
                  const SocialIcon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={i}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${isSans ? "px-3 py-3 rounded-lg bg-white-2 hover:bg-white-2-5" : "w-9 h-9 rounded-full border " + t.borderSubtle} flex items-center justify-center ${t.textMuted} transition-colors`}
                      aria-label={link.platform}
                    >
                      {SocialIcon ? (
                        <SocialIcon className="size-6 text-black-2"  />
                      ) : (
                        <span className="text-body-1">{link.platform[0]?.toUpperCase()}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-width hero image placeholder */}
      {content.heroImage && (
        <div className={cn("container-standard pb-0", animate && "animate-hero-fade-up-delayed")}>
          <div className={`relative w-full ${isSans ? "h-[320px] lg:h-[480px] rounded-xl" : "aspect-[16/7] rounded-2xl"} overflow-hidden bg-gradient-to-br from-white-2 to-white-1-5`}>
            {content.heroImage.src && (
              <Image
                src={content.heroImage.src}
                alt={content.heroImage.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.heroImage?.objectPosition }}
              />
            )}
          </div>
        </div>
      )}
    </SectionContainer>
  );
}
