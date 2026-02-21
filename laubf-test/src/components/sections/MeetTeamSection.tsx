/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline?: string -- label above heading (e.g. "ADULT", "LBCC TRUE VINE CLUB")
 *   heading: string -- section heading (e.g. "Meet Our Team")
 * -- Team Members (BASIC) --
 *   members[]: { name, role, bio?, image: { src, alt } }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, team member cards stagger in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: meet_team_sections (id, overline, heading, visible, color_scheme)
 * DB SCHEMA: team_members (id, section_id, name, role, image_src, image_alt, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { MeetTeamSectionProps } from "@/lib/types/sections";

/** "First Last" → "First L." from the name prop. */
function displayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0] ?? "";
  const first = parts[0];
  const lastInitial = (parts[parts.length - 1] ?? "").charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

export default function MeetTeamSection(props: {
  settings: MeetTeamSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      {/* Header — centered */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center text-center mb-12 lg:mb-16">
        {content.overline && (
          <p className={`text-h4 font-normal ${t.textMuted} mb-3`}>
            {content.overline}
          </p>
        )}
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
      </AnimateOnScroll>

      {/* Team member cards — centered */}
      <div className="flex flex-wrap justify-center gap-6">
        {content.members.map((member, i) => (
          <AnimateOnScroll key={i} animation="fade-up" staggerIndex={i} enabled={animate} className="flex flex-col w-full max-w-[280px]">
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
          </AnimateOnScroll>
        ))}
      </div>
    </SectionContainer>
  );
}
