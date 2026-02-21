/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   heading: string — "Featured Videos"
 *   ctaLabel: string — "View All Videos"
 *   ctaHref: string — "/videos"
 * ── Videos (BASIC) ──
 *   videos[]: VideoThumbnailData[] — 3 featured videos
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, video thumbnails stagger in.
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: videos (id, title, video_url, thumbnail_url, duration, featured, created_at)
 */
"use client";

import { useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader";
import VideoThumbnail from "@/components/shared/VideoThumbnail";
import VideoModal from "@/components/shared/VideoModal";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import type { MediaGridSectionProps } from "@/lib/types/sections";
import type { Video } from "@/lib/types/video";

export default function MediaGridSection(props: {
  settings: MediaGridSectionProps;
  videos?: Video[];
}) {
  const { settings, videos } = props;
  const { content } = settings;
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings} className="!pt-0">
      <div className="flex flex-col gap-8">
        <AnimateOnScroll animation="fade-up" enabled={animate}>
          <SectionHeader
            heading={content.heading}
            ctaLabel={content.ctaLabel}
            ctaHref={content.ctaHref}
          />
        </AnimateOnScroll>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.videos.map((video, i) => (
            <AnimateOnScroll key={video.id} animation="fade-up" staggerIndex={i} enabled={animate}>
              <VideoThumbnail
                data={video}
                size="grid"
                onClick={
                  videos && videos[i]
                    ? () => setSelectedVideo(videos[i])
                    : undefined
                }
              />
            </AnimateOnScroll>
          ))}
        </div>
      </div>

      {/* Video modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </SectionContainer>
  );
}
