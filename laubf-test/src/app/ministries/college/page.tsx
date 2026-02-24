import MinistryHeroSection from "@/components/sections/MinistryHeroSection";
import MinistryIntroSection from "@/components/sections/MinistryIntroSection";
import PillarsSection from "@/components/sections/PillarsSection";
import PhotoGallerySection from "@/components/sections/PhotoGallerySection";
import CampusCardGridSection from "@/components/sections/CampusCardGridSection";
import MeetTeamSection from "@/components/sections/MeetTeamSection";
import UpcomingEventsSection from "@/components/sections/UpcomingEventsSection";
import FormSection from "@/components/sections/FormSection";
import NewcomerSection from "@/components/sections/NewcomerSection";
import { getEventsByMinistry } from "@/lib/mock-data/events";

import type {
  MinistryHeroSectionProps,
  MinistryIntroSectionProps,
  PillarsSectionProps,
  PhotoGallerySectionProps,
  CampusCardGridSectionProps,
  MeetTeamSectionProps,
  UpcomingEventsSectionProps,
  FormSectionProps,
  NewcomerSectionProps,
} from "@/lib/types/sections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "College Ministry",
  description: "LA UBF college ministry — Bible study, fellowship, and discipleship for university students.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const heroData: MinistryHeroSectionProps = {
  id: "college-hero",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "MINISTRY",
    heading: "Young Adult / College",
    headingStyle: "sans",
    heroImage: {
      src: "/images/compressed/ministries/compressed-young%20adults.jpg",
      alt: "Young adult and college ministry group",
    },
  },
};

const introData: MinistryIntroSectionProps = {
  id: "college-intro",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "INTRODUCTION",
    heading: "Young Adult Ministry (YAM)",
    description:
      "The Young Adult Ministry (YAM) at LA UBF is a vibrant community of college students and young professionals growing together in faith. Through campus Bible study groups, fellowship activities, and shared worship, we create a space where young adults can explore God\u2019s Word, build meaningful friendships, and discover their calling. Whether you\u2019re on campus or in the workforce, you\u2019ll find a welcoming community here.",
    image: {
      src: "/images/compressed/ministries/young%20adults/compressed-yam.png",
      alt: "Young adult ministry fellowship",
    },
  },
};

const whatWeDoData: PillarsSectionProps = {
  id: "college-what-we-do",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "",
    heading: "What We Do",
    items: [
      {
        title: "Fellowship",
        description:
          "Our young adult fellowship is a space to build authentic friendships and grow together. From shared meals to group outings, we create opportunities for meaningful connection and community among college students and young professionals.",
        images: [
          { src: "/images/compressed/ministries/young%20adults/compressed-fellowship.png", alt: "Young adult fellowship" },
        ],
      },
      {
        title: "Discipleship Training",
        description:
          "Through personal and group Bible study, we help young adults develop a strong foundation in God\u2019s Word. Our discipleship training equips students to grow as leaders, mentors, and faithful followers of Christ.",
        images: [
          { src: "/pics-temp/DSC05299.jpg", alt: "Discipleship training" },
        ],
      },
      {
        title: "Serving Opportunities",
        description:
          "We believe in learning by serving. Young adults have the opportunity to serve through campus outreach, community events, conferences, and supporting the church\u2019s mission locally and beyond.",
        images: [
          { src: "/images/compressed/ministries/young%20adults/compressed-serving.jpg", alt: "Serving opportunities" },
        ],
      },
    ],
  },
};

const galleryData: PhotoGallerySectionProps = {
  id: "college-gallery",
  visible: true,
  colorScheme: "light",
  content: {
    heading: "Snippets from the Ministry",
    images: [
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-1.jpg", alt: "YAM moment 1" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-2.jpg", alt: "YAM moment 2" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-3.jpg", alt: "YAM moment 3" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-4.jpg", alt: "YAM moment 4" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-5.jpg", alt: "YAM moment 5" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-6.jpg", alt: "YAM moment 6" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-7.jpg", alt: "YAM moment 7" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-8.jpg", alt: "YAM moment 8" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-9.jpg", alt: "YAM moment 9" },
      { src: "/images/compressed/ministries/young%20adults/carousel/compressed-10.jpg", alt: "YAM moment 10" },
    ],
  },
};

const campusGridData: CampusCardGridSectionProps = {
  id: "campus-ministry",
  visible: true,
  colorScheme: "light",
  content: {
    decorativeImages: [
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg", alt: "Campus group photo" },
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg", alt: "Bible study outdoors" },
      { src: "/images/compressed/ministries/join-campus-ministry-section/compressed-3.png", alt: "Fellowship event" },
    ],
    heading: "Join a Campus Ministry",
    description:
      "We have Bible study groups meeting on campuses across Southern California. Find a group near you and start studying the Bible with fellow students.",
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
    ctaButton: { label: "Contact Us", href: "#plan-visit" },
  },
};

const teamData: MeetTeamSectionProps = {
  id: "college-team",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "YOUNG ADULT MINISTRY",
    heading: "Meet Our Team",
    members: [
      {
        name: "Leader name",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC05222.jpg", alt: "Leader name" },
      },
      {
        name: "Leader name",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC05299.jpg", alt: "Leader name" },
      },
      {
        name: "Leader name",
        role: "",
        bio: "Bio here",
        image: { src: "/pics-temp/DSC01195.jpg", alt: "Leader name" },
      },
    ],
  },
};

const collegeEvents = getEventsByMinistry("young-adult").slice(0, 3);

const eventsData: UpcomingEventsSectionProps = {
  id: "college-events",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "YOUNG ADULT MINISTRY",
    heading: "Upcoming Events",
    ctaButton: { label: "View all events", href: "/events" },
  },
};

const formData: FormSectionProps = {
  id: "plan-visit",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "Plan Your Visit",
    heading: "Let us help you start",
    description:
      "Let us know you\u2019re coming and we\u2019ll save a seat for you! We can also help match you with a Bible teacher or answer any questions about our ministries.",
    interestOptions: [
      { label: "Sunday Service", value: "sunday-service" },
      { label: "College Campus Group", value: "college-group" },
      { label: "Personal Bible Study", value: "personal-bible-study" },
      { label: "Group Bible Study", value: "group-bible-study" },
      { label: "Giving", value: "giving" },
      { label: "Other", value: "other" },
    ],
    campusOptions: [
      { label: "LBCC", value: "lbcc" },
      { label: "CSULB", value: "csulb" },
      { label: "CSUF", value: "csuf" },
      { label: "UCLA", value: "ucla" },
      { label: "USC", value: "usc" },
      { label: "CSUDH", value: "csudh" },
      { label: "Cerritos Community College", value: "ccc" },
      { label: "Mt. San Antonio College", value: "mt-sac" },
      { label: "Golden West College", value: "golden-west" },
      { label: "Cypress College", value: "cypress" },
      { label: "Cal Poly Pomona", value: "cal-poly-pomona" },
    ],
    bibleTeacherLabel:
      "I\u2019d like to be matched with a personal bible teacher for bible studies or spiritual guidance",
    submitLabel: "Submit",
    successMessage:
      "Thank you! We\u2019ve received your message and will get back to you soon.",
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
 * YOUNG ADULT / COLLEGE MINISTRY PAGE
 * Section order: Light → Light → Light → Light → Light → Light → Dark → Light → Light
 * ================================================================ */

export default function CollegePage() {
  return (
    <main>
      <MinistryHeroSection settings={heroData} />
      <MinistryIntroSection settings={introData} />
      <PillarsSection settings={whatWeDoData} />
      <PhotoGallerySection settings={galleryData} />
      <CampusCardGridSection settings={campusGridData} />
      <MeetTeamSection settings={teamData} />
      <UpcomingEventsSection settings={eventsData} events={collegeEvents} />
      <NewcomerSection settings={newcomerData} />
    </main>
  );
}
