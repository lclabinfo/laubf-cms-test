import MinistryHeroSection from "@/components/sections/MinistryHeroSection";
import MinistryIntroSection from "@/components/sections/MinistryIntroSection";
import PillarsSection from "@/components/sections/PillarsSection";
import PhotoGallerySection from "@/components/sections/PhotoGallerySection";
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
  MeetTeamSectionProps,
  UpcomingEventsSectionProps,
  FormSectionProps,
  NewcomerSectionProps,
} from "@/lib/types/sections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "High School Ministry",
  description: "LA UBF high school ministry — faith, friendship, and Bible study for teens.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const heroData: MinistryHeroSectionProps = {
  id: "high-school-hero",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "MINISTRY",
    heading: "Middle & High School",
    headingStyle: "sans",
    heroImage: {
      src: "/images/compressed/ministries/middle%20n%20high/compressed-header.jpg",
      alt: "Middle and high school ministry group photo",
    },
  },
};

const introData: MinistryIntroSectionProps = {
  id: "high-school-intro",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "INTRODUCTION",
    heading: "JBF & HBF",
    description:
      "JBF (Junior Bible Fellowship) and HBF (High School Bible Fellowship) are our youth ministries for middle school and high school students. Through engaging Bible studies, fun fellowship activities, and a supportive community, we help young people build a strong foundation of faith during these formative years.",
    image: {
      src: "/images/compressed/ministries/middle%20n%20high/compressed-introduction.jpg",
      alt: "JBF and HBF youth ministry",
    },
  },
};

const whatWeDoData: PillarsSectionProps = {
  id: "high-school-what-we-do",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "",
    heading: "What We Do",
    items: [
      {
        title: "Praise Night",
        description:
          "Praise Night is a time for our youth to come together in worship through music, prayer, and fellowship. It\u2019s an uplifting experience where students can express their faith and grow closer to God and each other.",
        images: [
          { src: "/images/compressed/ministries/middle%20n%20high/compressed-praise%20night.jpg", alt: "Youth praise night" },
        ],
      },
      {
        title: "Fellowship",
        description:
          "Fellowship activities give our youth the opportunity to build friendships, have fun, and strengthen their bonds within the church community through games, outings, and shared experiences.",
        images: [
          { src: "/images/compressed/ministries/middle%20n%20high/compressed-fellowship.jpg", alt: "Youth fellowship" },
        ],
      },
      {
        title: "Youth Conference",
        description:
          "Our annual Youth Conference brings together students for an immersive experience of worship, Bible study, and community. It\u2019s a highlight of the year where young people are inspired and challenged in their faith.",
        images: [
          { src: "/images/compressed/ministries/middle%20n%20high/compressed-jbfhbf%20conference.jpg", alt: "Youth conference" },
        ],
      },
    ],
  },
};

const galleryData: PhotoGallerySectionProps = {
  id: "high-school-gallery",
  visible: true,
  colorScheme: "light",
  content: {
    heading: "Snippets from the Ministry",
    images: [
      { src: "/images/compressed/ministries/middle%20n%20high/compressed-header.jpg", alt: "Youth ministry moment 1" },
      { src: "/images/compressed/ministries/middle%20n%20high/compressed-introduction.jpg", alt: "Youth ministry moment 2" },
      { src: "/images/compressed/ministries/middle%20n%20high/compressed-praise%20night.jpg", alt: "Youth ministry moment 3" },
      { src: "/images/compressed/ministries/middle%20n%20high/compressed-fellowship.jpg", alt: "Youth ministry moment 4" },
      { src: "/images/compressed/ministries/middle%20n%20high/compressed-jbfhbf%20conference.jpg", alt: "Youth ministry moment 5" },
    ],
  },
};

const teamData: MeetTeamSectionProps = {
  id: "high-school-team",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "JBF & HBF",
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

const highSchoolEvents = getEventsByMinistry("high-school").slice(0, 3);

const eventsData: UpcomingEventsSectionProps = {
  id: "high-school-events",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "YOUTH MINISTRY",
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
 * MIDDLE & HIGH SCHOOL (JBF & HBF) MINISTRY PAGE
 * Section order: Light → Light → Light → Light → Light → Dark → Light → Light
 * ================================================================ */

export default function HighSchoolPage() {
  return (
    <main>
      <MinistryHeroSection settings={heroData} />
      <MinistryIntroSection settings={introData} />
      <PillarsSection settings={whatWeDoData} />
      <PhotoGallerySection settings={galleryData} />
      <MeetTeamSection settings={teamData} />
      <UpcomingEventsSection settings={eventsData} events={highSchoolEvents} />
      <NewcomerSection settings={newcomerData} />
    </main>
  );
}
