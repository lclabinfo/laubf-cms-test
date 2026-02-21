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
  title: "LBCC Campus Ministry",
  description: "LA UBF campus ministry at Long Beach City College — Bible study and fellowship for LBCC students.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const heroData: MinistryHeroSectionProps = {
  id: "lbcc-hero",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "CAMPUS MINISTRY",
    heading: "LBCC\nTrue Vine Club",
    headingStyle: "sans",
    ctaButton: {
      label: "Start Bible Study",
      href: "https://startbiblestudy.org/lbcc",
      visible: true,
    },
    socialLinks: [
      { platform: "Email", href: "mailto:fishformen123@gmail.com" },
      { platform: "Instagram", href: "https://instagram.com/lbcc.ubf" },
      { platform: "Facebook", href: "https://www.facebook.com/lbcctruevine/" },
      { platform: "Website", href: "https://lbcctruevine.org/" },
    ],
    heroImage: {
      src: "/images/compressed/ministries/lbcc/compressed-lbcc-truevineclub.jpg",
      alt: "LBCC True Vine Club campus ministry",
    },
  },
};

const introData: MinistryIntroSectionProps = {
  id: "lbcc-intro",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "INTRODUCTION",
    heading: "About the Ministry",
    description:
      "\u201CI am the true vine, and my Father is the gardener.\u201D (John 15:1)\n\nLBCC True Vine is our campus ministry club at LBCC. We try to help each student to study the Bible, that through Bible study he or she may come to know God personally, and also come to know himself or herself, and find the clear purpose and meaning of life in our Lord Jesus Christ. We have group Bible studies at LBCC LAC Campus.",
  },
};

const scheduleData: MinistryScheduleSectionProps = {
  id: "lbcc-schedule",
  visible: true,
  colorScheme: "dark",
  content: {
    heading: "Join Us",
    description:
      "Whether you\u2019re a believer or just curious, you\u2019re welcome here.",
    scheduleLabel: "WHEN & WHERE",
    scheduleEntries: [
      {
        day: "Tuesdays",
        time: "12:00 PM - 1:00 PM",
        location: "College Center",
      },
      {
        day: "Thursdays",
        time: "5:00 PM - 6:00 PM",
        location: "College Center",
      },
    ],
    buttons: [
      {
        label: "Start Bible Study",
        href: "https://startbiblestudy.org/lbcc",
        variant: "primary" as const,
      },
      {
        label: "Visit our website",
        href: "https://lbcctruevine.org/",
        variant: "secondary" as const,
      },
    ],
  },
};

const teamData: MeetTeamSectionProps = {
  id: "lbcc-team",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "LBCC TRUE VINE CLUB",
    heading: "Meet Our Team",
    members: [
      {
        name: "William Larsen",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC05222.jpg", alt: "William Larsen" },
      },
      {
        name: "Troy Segale",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC05299.jpg", alt: "Troy Segale" },
      },
      {
        name: "Joey Fishman",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC01195.jpg", alt: "Joey Fishman" },
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
          "Campus Bible study groups meet at various times throughout the week depending on the campus. Most groups meet once or twice a week. Fill out the contact form above and we\u2019ll connect you with the group nearest to you.",
      },
      {
        question: "Do I need to bring anything?",
        answer:
          "Just bring yourself! We provide study materials and Bibles. Feel free to bring your own Bible if you have one.",
      },
      {
        question: "Is this only for LBCC students?",
        answer:
          "While our group is based at LBCC, anyone is welcome to join. You don\u2019t have to be a current student to attend.",
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
 * LBCC TRUE VINE CLUB CAMPUS MINISTRY PAGE
 * Section order: Light → Light → Dark → Light → Light → Light → Light
 * ================================================================ */

export default function LbccPage() {
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
