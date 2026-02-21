import { createElement, type ReactNode } from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

function icon(
  d: string,
  defaultSize = 24,
  viewBox = "0 0 24 24",
  strokeWidth = 2,
) {
  return function Icon(props: IconProps) {
    return createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: defaultSize,
        height: defaultSize,
        viewBox,
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        ...props,
      },
      createElement("path", { d }),
    );
  };
}

function multiIcon(
  children: ReactNode[],
  defaultSize = 24,
  viewBox = "0 0 24 24",
  strokeWidth = 2,
) {
  return function Icon(props: IconProps) {
    return createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: defaultSize,
        height: defaultSize,
        viewBox,
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        ...props,
      },
      ...children,
    );
  };
}

// ── Existing icons ──────────────────────────────────────────────

export const IconHamburger = icon("M3 12h18M3 6h18M3 18h18");

export const IconClose = icon("M18 6L6 18M6 6l12 12");

// ── New icons ───────────────────────────────────────────────────

/** Open book icon - for "Join us on Sunday" pathway card */
export const IconBookOpen = multiIcon([
  createElement("path", {
    key: "1",
    d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
  }),
  createElement("path", {
    key: "2",
    d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  }),
]);

/** Graduation cap icon - for "Are you a College Student?" pathway card */
export const IconGraduationCap = multiIcon([
  createElement("path", {
    key: "1",
    d: "M22 10v6M2 10l10-5 10 5-10 5z",
  }),
  createElement("path", {
    key: "2",
    d: "M6 12v5c0 0 3 3 6 3s6-3 6-3v-5",
  }),
]);

/** Calendar icon - for "Not sure where to start?" pathway card */
export const IconCalendar = multiIcon([
  createElement("rect", {
    key: "1",
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2",
    ry: "2",
  }),
  createElement("line", { key: "2", x1: "16", y1: "2", x2: "16", y2: "6" }),
  createElement("line", { key: "3", x1: "8", y1: "2", x2: "8", y2: "6" }),
  createElement("line", { key: "4", x1: "3", y1: "10", x2: "21", y2: "10" }),
]);

/** Chevron pointing down - for FAQ accordion and dropdowns */
export const IconChevronDown = icon("M6 9l6 6 6-6");

/** Arrow pointing right - for buttons/links */
export const IconArrowRight = icon("M5 12h14M12 5l7 7-7 7");

/** Question mark icon - for FAQ section header */
export const IconQuestionMark = multiIcon([
  createElement("circle", { key: "1", cx: "12", cy: "12", r: "10" }),
  createElement("path", {
    key: "2",
    d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
  }),
  createElement("line", { key: "3", x1: "12", y1: "17", x2: "12.01", y2: "17" }),
]);

/** Checkmark icon - for form success state */
export const IconCheck = icon("M20 6L9 17l-5-5");

/** Map pin location icon - for directions */
export const IconMapPin = multiIcon([
  createElement("path", {
    key: "1",
    d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
  }),
  createElement("circle", { key: "2", cx: "12", cy: "10", r: "3" }),
]);

/** External link arrow icon - for "Get Directions" link */
export const IconExternalLink = multiIcon([
  createElement("path", {
    key: "1",
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  }),
  createElement("polyline", { key: "2", points: "15 3 21 3 21 9" }),
  createElement("line", { key: "3", x1: "10", y1: "14", x2: "21", y2: "3" }),
]);

/** Play button triangle - for video overlay */
export const IconPlay = icon(
  "M5 3l14 9-14 9V3z",
);

/** Mail envelope icon - for email social link */
export const IconMail = multiIcon([
  createElement("rect", { key: "1", x: "2", y: "4", width: "20", height: "16", rx: "2" }),
  createElement("path", { key: "2", d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }),
]);

/** Instagram icon - for social link */
export const IconInstagram = multiIcon([
  createElement("rect", { key: "1", x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }),
  createElement("path", { key: "2", d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }),
  createElement("line", { key: "3", x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" }),
]);

/** Facebook icon - for social link */
export const IconFacebook = icon(
  "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
);

/** Clock icon - for event time display */
export const IconClock = multiIcon([
  createElement("circle", { key: "1", cx: "12", cy: "12", r: "10" }),
  createElement("polyline", { key: "2", points: "12 6 12 12 16 14" }),
]);

/** Search/magnifying glass icon - for events search input */
export const IconSearch = multiIcon([
  createElement("circle", { key: "1", cx: "11", cy: "11", r: "8" }),
  createElement("line", { key: "2", x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
]);

/** Share icon - for event detail share button */
export const IconShare = multiIcon([
  createElement("circle", { key: "1", cx: "18", cy: "5", r: "3" }),
  createElement("circle", { key: "2", cx: "6", cy: "12", r: "3" }),
  createElement("circle", { key: "3", cx: "18", cy: "19", r: "3" }),
  createElement("line", { key: "4", x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49" }),
  createElement("line", { key: "5", x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49" }),
]);

/** Grid icon - for card view toggle */
export const IconGrid = multiIcon([
  createElement("rect", { key: "1", x: "3", y: "3", width: "7", height: "7" }),
  createElement("rect", { key: "2", x: "14", y: "3", width: "7", height: "7" }),
  createElement("rect", { key: "3", x: "3", y: "14", width: "7", height: "7" }),
  createElement("rect", { key: "4", x: "14", y: "14", width: "7", height: "7" }),
]);

/** List icon - for list view toggle */
export const IconListView = icon("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01");

/** Chevron left - for calendar navigation */
export const IconChevronLeft = icon("M15 18l-6-6 6-6");

/** Chevron right - for breadcrumb separators */
export const IconChevronRight = icon("M9 18l6-6-6-6");

/** File/document icon - for bible study questions indicator */
export const IconFileText = multiIcon([
  createElement("path", { key: "1", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
  createElement("polyline", { key: "2", points: "14 2 14 8 20 8" }),
  createElement("line", { key: "3", x1: "16", y1: "13", x2: "8", y2: "13" }),
  createElement("line", { key: "4", x1: "16", y1: "17", x2: "8", y2: "17" }),
  createElement("polyline", { key: "5", points: "10 9 9 9 8 9" }),
]);

/** Help/question circle icon - for bible study answers indicator */
export const IconHelpCircle = multiIcon([
  createElement("circle", { key: "1", cx: "12", cy: "12", r: "10" }),
  createElement("path", { key: "2", d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
  createElement("line", { key: "3", x1: "12", y1: "17", x2: "12.01", y2: "17" }),
]);

/** Video icon - for bible study transcript indicator */
export const IconVideo = multiIcon([
  createElement("polygon", { key: "1", points: "23 7 16 12 23 17 23 7" }),
  createElement("rect", { key: "2", x: "1", y: "5", width: "15", height: "14", rx: "2", ry: "2" }),
]);

/** Arrow up-right icon - for bible study card link */
export const IconArrowUpRight = multiIcon([
  createElement("line", { key: "1", x1: "7", y1: "17", x2: "17", y2: "7" }),
  createElement("polyline", { key: "2", points: "7 7 17 7 17 17" }),
]);

/** Folder icon - for series cards */
export const IconFolder = multiIcon([
  createElement("path", { key: "1", d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }),
]);

/** Filter/funnel icon - for filter toolbar disclosure button */
export const IconFilter = multiIcon([
  createElement("polygon", { key: "1", points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }),
]);

/** User/person icon - for message speaker display */
export const IconUser = multiIcon([
  createElement("path", { key: "1", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
  createElement("circle", { key: "2", cx: "12", cy: "7", r: "4" }),
]);

/** Arrow pointing down - for sort descending */
export const IconArrowDown = icon("M12 5v14M19 12l-7 7-7-7");

/** Arrow pointing up - for sort ascending */
export const IconArrowUp = icon("M12 19V5M5 12l7-7 7 7");

/** X/close icon - for clear all */
export const IconX = multiIcon([
  createElement("line", { key: "1", x1: "18", y1: "6", x2: "6", y2: "18" }),
  createElement("line", { key: "2", x1: "6", y1: "6", x2: "18", y2: "18" }),
]);

/** Link/chain icon - for online meeting button */
export const IconLink = multiIcon([
  createElement("path", {
    key: "1",
    d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
  }),
  createElement("path", {
    key: "2",
    d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  }),
]);
