/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "Snippets from the Ministry")
 * -- Media (BASIC) --
 *   images[]: { src, alt } -- gallery photos
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading fades up, carousel fades in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: photo_gallery_sections (id, heading, visible, color_scheme)
 * DB SCHEMA: photo_gallery_images (id, section_id, src, alt, sort_order)
 */
"use client";

import { SectionThemeContext, themeTokens } from "@/lib/theme";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import type { PhotoGallerySectionProps } from "@/lib/types/sections";
import Image from "next/image";

const paddingYMap = {
  none: "py-0",
  compact: "py-16 lg:py-20",
  default: "py-24 lg:py-30",
  spacious: "py-32 lg:py-40",
} as const;

export default function PhotoGallerySection(props: {
  settings: PhotoGallerySectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  if (!settings.visible) return null;

  // Double the images for seamless infinite loop
  const loopImages = [...content.images, ...content.images];
  const paddingClass = paddingYMap[settings.paddingY ?? "default"];

  return (
    <SectionThemeContext.Provider value={settings.colorScheme}>
      <section id={settings.id} className={`${t.bg} ${paddingClass} overflow-hidden`}>
        {/* Centered heading inside container */}
        <div className="container-standard">
          <AnimateOnScroll animation="fade-up" enabled={animate}>
            <h2 className={`text-h2 ${t.textPrimary} text-center mb-12`}>
              {content.heading}
            </h2>
          </AnimateOnScroll>
        </div>

        {/* Full-width infinite scrolling carousel — no container */}
        <div className="w-full overflow-hidden">
          <div
            className="flex gap-4 animate-carousel"
            style={{ width: "max-content" }}
          >
            {loopImages.map((img, i) => (
              <div
                key={i}
                className="relative w-[300px] lg:w-[360px] aspect-[4/3] rounded-2xl overflow-hidden shrink-0"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  style={{ objectPosition: img.objectPosition }}
                />
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes carousel-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-carousel {
            animation: carousel-scroll 30s linear infinite;
          }
          .animate-carousel:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>
    </SectionThemeContext.Provider>
  );
}
