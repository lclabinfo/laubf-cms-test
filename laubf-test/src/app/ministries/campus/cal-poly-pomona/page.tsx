import MinistryHeroSection from "@/components/sections/MinistryHeroSection";
import MinistryIntroSection from "@/components/sections/MinistryIntroSection";
import MinistryScheduleSection from "@/components/sections/MinistryScheduleSection";
import MeetTeamSection from "@/components/sections/MeetTeamSection";
import FAQSection from "@/components/sections/FAQSection";
import CampusCardGridSection from "@/components/sections/CampusCardGridSection";

import type {
  MinistryHeroSectionProps,
  MinistryIntroSectionProps,
  MinistryScheduleSectionProps,
  MeetTeamSectionProps,
  FAQSectionProps,
  CampusCardGridSectionProps,
} from "@/lib/types/sections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cal Poly Pomona Campus Ministry",
  description: "LA UBF campus ministry at Cal Poly Pomona — Bible study and fellowship for CPP students.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const heroData: MinistryHeroSectionProps = {
  id: "cal-poly-pomona-hero",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "CAMPUS MINISTRY",
    heading: "Cal Poly Pomona",
    headingStyle: "sans",
    ctaButton: {
      label: "Start Bible Study",
      href: "https://startbiblestudy.org/cal-poly-pomona",
      visible: true,
    },
    socialLinks: [
      // { platform: "Email", href: "mailto:cpp@laubf.org" },
      // { platform: "Instagram", href: "https://instagram.com/cpp.ubf" },
      // { platform: "Facebook", href: "https://facebook.com/cpp.ubf" },
    ],
    heroImage: {
      src: "",
      alt: "Cal Poly Pomona campus ministry",
    },
  },
};

const introData: MinistryIntroSectionProps = {
  id: "cal-poly-pomona-intro",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "INTRODUCTION",
    heading: "About the Ministry",
    description: "coming soon"  },
};

const scheduleData: MinistryScheduleSectionProps = {
  id: "cal-poly-pomona-schedule",
  visible: true,
  colorScheme: "dark",
  content: {
    heading: "Join Us",
    description:
      "Whether you're a believer or just curious, you're welcome here.",
    scheduleLabel: "WHEN & WHERE",
    scheduleEntries: [
      // {
      //   day: "Tuesdays",
      //   time: "12:00 PM - 1:00 PM",
      //   location: "Bronco Student Center",
      // },
      // {
      //   day: "Thursdays",
      //   time: "5:00 PM - 6:00 PM",
      //   location: "Bronco Student Center",
      // },
    ],
    buttons: [
      { label: "Start Bible Study", href: "https://startbiblestudy.org/cal-poly-pomona", variant: "primary" },
      // {
      //   label: "Visit our website",
      //   href: "https://cpprockofages.org/",
      //   variant: "secondary",
      // },
    ],
  },
};

const teamData: MeetTeamSectionProps = {
  id: "cal-poly-pomona-team",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "CAL POLY POMONA",
    heading: "Meet Our Team",
    members: [
      {
        name: "Andrew Cuevas",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC05222.jpg", alt: "Andrew Cuevas" },
      },
    ],
  },
};

const faqData: FAQSectionProps = {
  id: "faq",
  visible: true,
  colorScheme: "light",
  containerWidth: "narrow",
  content: {
    heading: "Frequently Asked Questions",
    showIcon: true,
    items: [
      {
        question: "Where and when do campus groups meet?",
        answer:
          "Campus Bible study groups meet at various times throughout the week depending on the campus. Most groups meet once or twice a week. Fill out the contact form above and we'll connect you with the group nearest to you.",
      },
      {
        question: "Do I need to bring anything?",
        answer:
          "Just bring yourself! We provide study materials and Bibles. Feel free to bring your own Bible if you have one.",
      },
      {
        question: "Is this only for Cal Poly Pomona students?",
        answer:
          "While our group is based at Cal Poly Pomona, anyone is welcome to join. You don't have to be a current student to attend.",
      },
      {
        question: "What denomination is UBF?",
        answer:
          "UBF is a non-denominational evangelical Christian organization. We focus on Bible study and discipleship across all Christian traditions.",
      },
      {
        question: "How can I get involved beyond Bible study?",
        answer:
          "There are many ways to get involved! Join us for fellowship meals, outreach events, conferences, and worship services. Talk to a group leader to learn more.",
      },
    ],
  },
};

const campusGridData: CampusCardGridSectionProps = {
  id: "other-campuses",
  visible: true,
  colorScheme: "light",
  content: {
    decorativeImages: [
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg", alt: "Campus group photo" },
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg", alt: "Bible study outdoors" },
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-3.png", alt: "Fellowship event" },
    ],
    heading: "Check out other campuses",
    campuses: [
      { id: "lbcc", abbreviation: "LBCC", fullName: "Long Beach City College", href: "/ministries/campus/lbcc" },
      { id: "csulb", abbreviation: "CSULB", fullName: "Cal State Long Beach", href: "/ministries/campus/csulb" },
      { id: "csuf", abbreviation: "CSUF", fullName: "Cal State Fullerton", href: "/ministries/campus/csuf" },
      { id: "ucla", abbreviation: "UCLA", fullName: "University of California, Los Angeles", href: "/ministries/campus/ucla" },
      { id: "usc", abbreviation: "USC", fullName: "University of Southern California", href: "/ministries/campus/usc" },
      { id: "csudh", abbreviation: "CSUDH", fullName: "Cal State Dominguez Hills", href: "/ministries/campus/csudh" },
      { id: "ccc", abbreviation: "CCC", fullName: "Cerritos Community College", href: "/ministries/campus/ccc" },
      { id: "mt-sac", abbreviation: "MT. SAC", fullName: "Mt. San Antonio College", href: "/ministries/campus/mt-sac" },
      { id: "golden-west", abbreviation: "GWC", fullName: "Golden West College", href: "/ministries/campus/golden-west" },
      { id: "cypress", abbreviation: "", fullName: "Cypress College", href: "/ministries/campus/cypress" },
      { id: "cal-poly-pomona", abbreviation: "", fullName: "Cal Poly Pomona", href: "/ministries/campus/cal-poly-pomona" },
    ],
  },
};

/* ================================================================
 * CAL POLY POMONA CAMPUS MINISTRY PAGE
 * Section order: Light → Light → Dark → Light → Light → Light → Light
 * ================================================================ */

export default function CalPolyPomonaPage() {
  return (
    <main>
      <MinistryHeroSection settings={heroData} />
      <MinistryIntroSection settings={introData} />
      <MinistryScheduleSection settings={scheduleData} />
      <MeetTeamSection settings={teamData} />
      <FAQSection settings={faqData} />
      <CampusCardGridSection settings={campusGridData} />
    </main>
  );
}
