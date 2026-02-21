/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   heading: string — section heading
 *   items[]: { id, name, active?, href? }
 *   image: { src, alt }
 * ── CTA (BASIC) ──
 *   ctaHeading: string — CTA prompt text
 *   ctaButton: { label, href }
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: directory_list_sections (id, heading, cta_heading, cta_btn_label,
 *   cta_btn_href, image_url, visible)
 *   + directory_items (id, name, short_name, slug, active, position)
 */
"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMotionValue, useSpring, motion } from "motion/react";
import { SectionThemeContext } from "@/lib/theme";
import CTAButton from "@/components/shared/CTAButton";
import type { DirectoryListSectionProps } from "@/lib/types/sections";
import Image from "next/image";
import Link from "next/link";

export default function DirectoryListSection(props: {
  settings: DirectoryListSectionProps;
}) {
  const { settings } = props;
  if (!settings.visible) return null;

  const { content } = settings;

  return (
    <SectionThemeContext.Provider value="light">
      <div className="bg-white-1">
        {/* Desktop: parallax layout */}
        <div className="hidden lg:block">
          <DirectoryParallaxBlock
            heading={content.heading}
            items={content.items}
            image={content.image}
          />
        </div>

        {/* Mobile: centered list with image header */}
        <div className="lg:hidden">
          <DirectoryMobileBlock
            heading={content.heading}
            items={content.items}
            image={content.image}
          />
        </div>

        {/* CTA block */}
        <section className="flex flex-col items-center gap-5 pb-20 lg:pb-30 pt-8 text-center px-4">
          <h3 className="text-h3 text-black-1">{content.ctaHeading}</h3>
          <CTAButton
            label={content.ctaButton.label}
            href={content.ctaButton.href}
            variant="primary"
          />
        </section>
      </div>
    </SectionThemeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile block — image header + centered list                        */
/* ------------------------------------------------------------------ */

function DirectoryMobileBlock({
  heading,
  items,
  image,
}: {
  heading: string;
  items: DirectoryListSectionProps["content"]["items"];
  image: DirectoryListSectionProps["content"]["image"];
}) {
  return (
    <section className="px-4 pt-20 pb-8">
      <div className="flex flex-col items-center gap-5">
        {/* Small image + heading */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-[140px] w-[240px] overflow-hidden rounded-xl">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              style={{ objectPosition: image.objectPosition }}
            />
          </div>
          <h2 className="text-h2 text-black-1 text-center">{heading}</h2>
        </div>

        {/* Centered campus list */}
        <div className="flex flex-col items-center gap-0 w-full">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href ?? `#${item.id}`}
              className="group flex items-center justify-center gap-3 w-full max-w-[320px] py-3 rounded-lg transition-colors hover:bg-white-1-5"
            >
              <span className="text-h3 font-medium text-black-3 transition-colors group-hover:text-black-1">
                {item.name}
              </span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 48 48"
                fill="none"
                className="text-black-3 opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
              >
                <path
                  d="M14 34L34 14M34 14H14M34 14V34"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Parallax block — directory list (left) + heading & image (right)  */
/* ------------------------------------------------------------------ */

const PARALLAX_TRAVEL = 320;

function DirectoryParallaxBlock({
  heading,
  items,
  image,
}: {
  heading: string;
  items: DirectoryListSectionProps["content"]["items"];
  image: DirectoryListSectionProps["content"]["image"];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion value driven by scroll, spring smooths it with a slight lag
  const rawY = useMotionValue(0);
  const smoothY = useSpring(rawY, { stiffness: 150, damping: 30, mass: 0.5 });

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // How far the section top has scrolled past the viewport top (px).
    // Positive = section top is above the viewport.
    const scrollPast = Math.max(0, -rect.top);

    // Keep right column aligned (y=0) for the first 100px of scroll,
    // then smoothly ramp up to full travel by 350px. This keeps the
    // heading aligned with the top of the list when the section first
    // appears, then gradually moves it as the user scrolls deeper.
    const startPx = 0;
    const endPx = 100;
    const parallaxProgress = Math.max(
      0,
      Math.min(1, (scrollPast - startPx) / (endPx - startPx)),
    );

    rawY.set(parallaxProgress * PARALLAX_TRAVEL);
  }, [rawY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section ref={containerRef} className="relative h-[900px] overflow-hidden pt-30">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-0">
        <div className="flex justify-center gap-12">
          {/* Left column: campus list — sticky */}
          <div className="sticky top-30 w-[540px] shrink-0 self-start">
            <div className="flex flex-col items-end gap-4">
              {items.map((item) => (
                <DirectoryLink
                  key={item.id}
                  name={item.name}
                  href={item.href ?? `#${item.id}`}
                />
              ))}
            </div>
          </div>

          {/* Right column: heading + image — sticky with parallax */}
          <div className="sticky top-0 w-full max-w-[480px] self-start">
            <motion.div
              className="flex flex-col gap-6 will-change-transform"
              style={{ y: smoothY }}
            >
              <h2 className="text-h2 max-w-[280px] text-black-1">
                {heading}
              </h2>
              <div className="relative h-[240px] w-[400px] overflow-hidden rounded-xl">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  style={{ objectPosition: image.objectPosition }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual directory link with hover arrow animation               */
/* ------------------------------------------------------------------ */

function DirectoryLink({ name, href }: { name: string; href: string }) {
  return (
    <Link
      href={href}
      className="group relative flex h-12 w-full items-center justify-end"
    >
      {/* Text — shifts left via transform (no layout reflow) */}
      <span className="text-h2 font-medium leading-none text-white-3 transition-[color,translate] duration-300 ease-[cubic-bezier(0,0.55,0.45,1)] group-hover:-translate-x-[60px] group-hover:text-black-1">
        {name}
      </span>
      {/* Arrow — always positioned in place, only fades in (no translate shift = no jitter) */}
      <span className="absolute right-0 flex h-full w-[60px] items-center justify-center opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0,0.55,0.45,1)] group-hover:opacity-100 pointer-events-none">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="text-black-1"
        >
          <path
            d="M14 34L34 14M34 14H14M34 14V34"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
