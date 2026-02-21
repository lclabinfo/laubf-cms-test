/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   heading.line1: string — top line ("Welcome to")
 *   heading.line2: string — bottom line in DM Serif Display italic ("LA UBF")
 *   subheading: string — multi-line descriptor
 * ── Buttons (BASIC) ──
 *   primaryButton: { label, href, visible }
 *   secondaryButton: { label, href, visible }
 * ── Media (BASIC) ──
 *   backgroundImage: { src, alt }
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle entry animations
 *     Animations: background image fades in, heading + subheading slide up
 *     with staggered delays, buttons fade up last.
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: hero_banner_sections (id, heading_line1, heading_line2, subheading,
 *   primary_btn_label, primary_btn_href, secondary_btn_label, secondary_btn_href,
 *   background_image_url, background_image_alt, visible, color_scheme)
 */
"use client";

import { useEffect, useRef } from "react";
import { SectionThemeContext } from "@/lib/theme";
import type { HeroBannerSectionProps } from "@/lib/types/sections";
import CTAButton from "@/components/shared/CTAButton";
import { cn } from "@/lib/utils";
import Image from "next/image";

const COMPRESSED_VIDEO = "/videos/compressed-hero-vid.webm";
const LG_BREAKPOINT = 1024;

export default function HeroBannerSection(props: { settings: HeroBannerSectionProps }) {
  const { settings } = props;
  if (!settings.visible) return null;

  const { content } = settings;
  const animate = settings.enableAnimations !== false;

  return (
    <SectionThemeContext.Provider value="dark">
      <section id="hero-section" className="relative flex min-h-screen items-end overflow-hidden bg-black-1 -mt-[76px]">
        {/* Background media */}
        {content.backgroundImage.src.endsWith(".mp4") ? (
          <HeroVideo
            desktopSrc={content.backgroundImage.src}
            mobileSrc={COMPRESSED_VIDEO}
            animate={animate}
          />
        ) : (
          <Image
            src={content.backgroundImage.src}
            alt={content.backgroundImage.alt}
            fill
            priority
            className={cn("object-cover", animate && "animate-hero-fade-in-slow")}
            style={{ objectPosition: content.backgroundImage.objectPosition }}
          />
        )}

        {/* Bottom gradient overlay */}
        {/* Desktop & tablet (≥480px): existing gradient */}
        <div
          className="hidden sm:block absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(195deg, rgba(13,13,13,0) 50%, rgba(13,13,13,0.5) 65%, rgb(13,13,13) 100%)",
          }}
        />
        {/* Mobile (<480px): simpler top-to-bottom fade gradient */}
        <div
          className="block sm:hidden absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(13,13,13, 0) 40%, rgba(13,13,13, 0.8) 60%, rgb(13,13,13) 100%)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-1 w-full pb-10 lg:pb-14">
          <div className="container-standard lg:px-0 lg:ml-20 lg:max-w-none">
            <div className="flex flex-col gap-8 max-w-[500px]">
              {/* Heading */}
              <div className={cn("flex flex-col gap-4", animate && "animate-hero-fade-up")}>
                <div className="flex flex-col leading-[0.8] text-white-1 drop-shadow-lg">
                  <span className="text-h1">{content.heading.line1}</span>
                  <span className="text-hero-accent">
                    {content.heading.line2}
                  </span>
                </div>

                {/* Subheading */}
                {settings.showSubheading && content.subheading && (
                  <div className={cn("text-[20px] lg:text-[24px] leading-[1.2] tracking-[-0.04em]", animate && "animate-hero-fade-up-delayed")}>
                    {content.subheading.split("\n").map((line, i) => {
                      const parts = line.split(
                        /(\b(?:people find their community|disciples are raised|the Word of God is lived)\b)/,
                      );
                      return (
                        <p key={i} className="mb-0">
                          {parts.map((part, j) =>
                            /people find|disciples are|the Word of/.test(
                              part,
                            ) ? (
                              <span key={j} className="text-white-2">
                                {part}
                              </span>
                            ) : (
                              <span key={j} className="text-white-3">
                                {part}
                              </span>
                            ),
                          )}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className={cn("flex flex-col sm:flex-row gap-3", animate && "animate-hero-fade-up-delayed-2")}>
                {content.primaryButton.visible && (
                  <CTAButton
                    label={content.primaryButton.label}
                    href={content.primaryButton.href}
                    variant="primary"
                  />
                )}
                {content.secondaryButton.visible && (
                  <CTAButton
                    label={content.secondaryButton.label}
                    href={content.secondaryButton.href}
                    variant="secondary"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionThemeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  HeroVideo — single <video> element, picks source by screen width  */
/* ------------------------------------------------------------------ */
function HeroVideo({ desktopSrc, mobileSrc, animate }: { desktopSrc: string; mobileSrc: string; animate: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Pick the right source for this screen size
    const applySrc = () => {
      const isDesktop = window.innerWidth >= LG_BREAKPOINT;
      const next = isDesktop ? desktopSrc : mobileSrc;
      if (video.src.endsWith(next)) return;
      video.src = next;
      video.load();
      video.play().catch(() => {});
    };

    applySrc();

    // Swap source on breakpoint change (resize / orientation)
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    mql.addEventListener("change", applySrc);

    // Resume playback when scrolling back into view —
    // mobile browsers pause off-screen videos to save battery.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && video.paused) {
          video.play().catch(() => {});
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(video);

    // Manual loop: we intentionally omit the `loop` attribute because
    // when it's set the `ended` event never fires (per spec), so if the
    // browser's native loop breaks for webm we'd have no fallback.
    // Instead we loop manually via `ended` + a `timeupdate` safety net.
    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    video.addEventListener("ended", handleEnded);

    // Safety net: if `ended` never fires (some mobile browsers stall at
    // the very end), restart when we're within 0.3 s of the duration.
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.3) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      mql.removeEventListener("change", applySrc);
      observer.disconnect();
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [desktopSrc, mobileSrc]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={cn("absolute inset-0 h-full w-full object-cover", animate && "animate-hero-fade-in-slow")}
    />
  );
}
