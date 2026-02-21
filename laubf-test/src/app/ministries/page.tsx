import TextImageHeroSection from "@/components/sections/TextImageHeroSection";
import PillarsSection from "@/components/sections/PillarsSection";
import CampusCardGridSection from "@/components/sections/CampusCardGridSection";
import NewcomerSection from "@/components/sections/NewcomerSection";

import type {
  TextImageHeroSectionProps,
  PillarsSectionProps,
  CampusCardGridSectionProps,
  NewcomerSectionProps,
} from "@/lib/types/sections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministries",
  description: "Explore LA UBF ministries — campus, college, young adult, high school, and children's programs.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const textImageHeroData: TextImageHeroSectionProps = {
  id: "ministries-hero",
  visible: true,
  colorScheme: "light",
  textAlign: "center",
  content: {
    overline: "WHO WE ARE",
    headingLine1: "Our Ministries",
    description:
      "At LA UBF, we believe that spiritual growth happens best in community. Whether you are a student, a working professional, or a parent, there is a place for you here.",
    image: {
      src: "/images/compressed/ministries/compressed-congregation.jpg",
      alt: "LA UBF community gathering",
    },
  },
};

const ageGroupsData: PillarsSectionProps = {
  id: "age-groups",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "MINISTRIES",
    heading: "Age Groups",
    items: [
      {
        title: "Young Adults",
        description:
          "A community of college students and young professionals growing together through campus Bible studies, fellowship, and shared worship.",
        images: [{ src: "/images/compressed/ministries/compressed-young%20adults.jpg", alt: "Young adults Bible study" }],
        button: { label: "Learn more", href: "/ministries/college" },
      },
      {
        title: "Adults",
        description:
          "Adults from many walks of life\u2014campus leaders, Bible teachers, parents, and missionaries\u2014growing in faith through personal and group Bible study, conferences, and outreach.",
        images: [
          { src: "/images/compressed/ministries/compressed-adults.webp", alt: "Adult fellowship" },
        ],
        button: { label: "Learn more", href: "/ministries/adults" },
      },
      {
        title: "Middle & High School\n(HBF / JBF)",
        description:
          "Our youth ministries for middle and high school students, with engaging Bible studies, fun fellowship activities, and a supportive community during these formative years.",
        images: [
          { src: "/images/compressed/ministries/compressed-middle%20n%20high.jpg", alt: "HBF JBF students" },
        ],
        button: { label: "Learn more", href: "/ministries/high-school" },
      },
      {
        title: "Children (CBF)",
        description:
          "A safe, engaging, and age-appropriate environment where children can learn about God\u2019s Word and build friendships while growing in faith.",
        images: [
          { src: "/images/compressed/ministries/compressed-children.webp", alt: "Children Bible fellowship" },
        ],
        button: { label: "Learn more", href: "/ministries/children" },
      },
    ],
  },
};

const campusCardGridData: CampusCardGridSectionProps = {
  id: "campus-ministry",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "Are you a college student?",
    heading: "Join a Campus Ministry",
    description:
      "We have bible study clubs all across different college campuses. Join us for weekly group bible studies and get to know each other through fellowship.",
    decorativeImages: [
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg", alt: "Campus group photo" },
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg", alt: "Bible study outdoors" },
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-3.png", alt: "Fellowship event" },
    ],
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
    ctaHeading: "Don\u2019t see your campus?",
    ctaButton: {
      label: "Let us know your interest",
      href: "/im-new#plan-visit",
    },
  },
};

const newcomerData: NewcomerSectionProps = {
  id: "newcomer",
  visible: true,
  colorScheme: "dark",
  content: {
    heading: "Are you a newcomer?",
    description:
      "We know that visiting a new church can be intimidating. Learn more about our church and how you can take your next steps at LA UBF.",
    buttonLabel: "I\u2019m new",
    buttonHref: "/im-new",
    image: {
      src: "/images/compressed/home/compressed-sunday-worship.jpg",
      alt: "Sunday worship at LA UBF",
    },
  },
};

/* ================================================================
 * MINISTRIES PAGE
 * Section order: Light → Dark → Light → Light
 * ================================================================ */

export default function MinistriesPage() {
  return (
    <main>
      <TextImageHeroSection settings={textImageHeroData} />
      <PillarsSection settings={ageGroupsData} />
      <CampusCardGridSection settings={campusCardGridData} />
      <NewcomerSection settings={newcomerData} />
    </main>
  );
}
