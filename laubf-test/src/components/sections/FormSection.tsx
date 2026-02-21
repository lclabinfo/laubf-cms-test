/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string -- label above heading (e.g. "PLAN YOUR VISIT")
 *   heading: string -- section heading (Helvetica Neue Medium)
 *   description: string -- intro paragraph below heading
 * -- Interest Options (BASIC) --
 *   interestOptions[]: { label, value } -- checkbox grid items
 * -- Campus Options (BASIC) --
 *   campusOptions[]: { label, value } -- select dropdown options
 * -- Form Config (BASIC) --
 *   bibleTeacherLabel: string -- standalone checkbox label
 *   submitLabel: string -- submit button text
 *   successMessage: string -- message shown on submit
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, form card scales in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: form_sections (id, overline, heading, description, bible_teacher_label, submit_label, success_message, visible, color_scheme)
 * DB SCHEMA: form_interest_options (id, section_id, label, value, sort_order)
 * DB SCHEMA: form_campus_options (id, section_id, label, value, sort_order)
 */
"use client";

import { useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import OverlineLabel from "@/components/shared/OverlineLabel";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { FormSectionProps } from "@/lib/types/sections";
import CTAButton from "@/components/shared/CTAButton";
import { IconChevronDown, IconCheck } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

export default function FormSection(props: { settings: FormSectionProps }) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  const [submitted, setSubmitted] = useState(false);
  const [checkedInterests, setCheckedInterests] = useState<Set<string>>(
    new Set(),
  );
  const [otherSpecify, setOtherSpecify] = useState("");
  const [bibleTeacher, setBibleTeacher] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState("");
  const [otherCampus, setOtherCampus] = useState("");

  const showOtherField = checkedInterests.has("other");

  function toggleInterest(value: string) {
    setCheckedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  const inputStyles =
    "w-full bg-white-1-5 border border-white-2 rounded-lg px-4 py-3.5 text-body-2 text-black-1 placeholder:text-white-3 outline-none focus:border-brand-1 transition-colors";

  return (
    <SectionContainer settings={settings}>
      {/* Header area -- centered text */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center text-center mb-12">
        <OverlineLabel text={content.overline} className="mb-4" />
        <h2 className={`text-h2 ${t.textPrimary} text-center`}>
          {content.heading}
        </h2>
        <p
          className={`text-body-1 ${t.textSecondary} text-center max-w-2xl mx-auto mt-4`}
        >
          {content.description}
        </p>
      </AnimateOnScroll>

      {/* White form card */}
      {submitted ? (
        /* Success state */
        <div className="bg-white-0 rounded-[40px] p-8 lg:p-12 max-w-[800px] mx-auto">
          <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
            <div className="w-16 h-16 rounded-full bg-brand-1/20 flex items-center justify-center">
              <IconCheck className="size-8 text-brand-1" strokeWidth={2.5} />
            </div>
            <h3 className="text-h3 text-black-1">{content.successMessage}</h3>
            <p className="text-body-1 text-black-2">
              We will be in touch with you soon.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white-0 rounded-[40px] p-8 lg:p-12 max-w-[800px] mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Row 1: First Name + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="text-overline text-black-3 mb-2 block">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  required
                  className={inputStyles}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-overline text-black-3 mb-2 block">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  required
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Row 2: Email Address + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="text-overline text-black-3 mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  required
                  className={inputStyles}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-overline text-black-3 mb-2 block">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 123-4567"
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Interest checkboxes */}
            <div className="flex flex-col">
              <label className="text-overline text-black-3 mb-3 block">
                I&apos;m Interested In...
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {content.interestOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        checkedInterests.has(option.value)
                          ? "bg-brand-1 border-brand-1"
                          : "border-white-2-5 bg-white-0",
                      )}
                    >
                      {checkedInterests.has(option.value) && (
                        <IconCheck
                          className="size-3.5 text-white-0"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={checkedInterests.has(option.value)}
                      onChange={() => toggleInterest(option.value)}
                      className="sr-only"
                    />
                    <span className="text-body-2 text-black-1">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Other specify field */}
              {showOtherField && (
                <div className="mt-3">
                  <input
                    type="text"
                    name="otherInterest"
                    placeholder="Please specify your interest"
                    value={otherSpecify}
                    onChange={(e) => setOtherSpecify(e.target.value)}
                    className={inputStyles}
                  />
                </div>
              )}
            </div>

            {/* Campus select dropdown */}
            <div className="flex flex-col">
              <label className="text-overline text-black-3 mb-2 block">
                College Campus (Optional)
              </label>
              <div className="relative">
                <select
                  name="campus"
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className={cn(
                    inputStyles,
                    "appearance-none pr-12 cursor-pointer",
                  )}
                >
                  <option value="">Select a campus</option>
                  {content.campusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
                <IconChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-black-3 pointer-events-none" />
              </div>
              {selectedCampus === "other" && (
                <input
                  type="text"
                  name="otherCampus"
                  placeholder="Enter your college name"
                  value={otherCampus}
                  onChange={(e) => setOtherCampus(e.target.value)}
                  className={cn(inputStyles, "mt-3")}
                />
              )}
            </div>

            {/* Questions or comments textarea */}
            <div className="flex flex-col">
              <label className="text-overline text-black-3 mb-2 block">
                Questions or Comments (Optional)
              </label>
              <textarea
                name="comments"
                placeholder="Share anything you'd like us to know..."
                className={cn(inputStyles, "min-h-[100px] resize-none")}
              />
            </div>

            {/* Bible teacher checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <span
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                  bibleTeacher
                    ? "bg-brand-1 border-brand-1"
                    : "border-white-2-5 bg-white-0",
                )}
              >
                {bibleTeacher && (
                  <IconCheck
                    className="size-3.5 text-white-0"
                    strokeWidth={3}
                  />
                )}
              </span>
              <input
                type="checkbox"
                checked={bibleTeacher}
                onChange={(e) => setBibleTeacher(e.target.checked)}
                className="sr-only"
              />
              <span className="text-body-2 text-black-2 leading-relaxed">
                {content.bibleTeacherLabel}
              </span>
            </label>

            {/* Submit button */}
            <CTAButton
              label={content.submitLabel}
              variant="primary"
              size="full"
              theme="light"
              type="submit"
              className="mt-2"
            />
          </form>
        </div>
      )}
    </SectionContainer>
  );
}
