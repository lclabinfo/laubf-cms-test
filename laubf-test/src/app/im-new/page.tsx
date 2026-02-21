import PageHeroSection from "@/components/sections/PageHeroSection";
import FeatureBreakdownSection from "@/components/sections/FeatureBreakdownSection";
import PathwayCardSection from "@/components/sections/PathwayCardSection";
import TimelineSection from "@/components/sections/TimelineSection";
import LocationDetailSection from "@/components/sections/LocationDetailSection";
import CampusCardGridSection from "@/components/sections/CampusCardGridSection";
import FormSection from "@/components/sections/FormSection";
import FAQSection from "@/components/sections/FAQSection";

import type {
  PageHeroSectionProps,
  FeatureBreakdownSectionProps,
  PathwayCardSectionProps,
  TimelineSectionProps,
  LocationDetailSectionProps,
  CampusCardGridSectionProps,
  FormSectionProps,
  FAQSectionProps,
} from "@/lib/types/sections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "I'm New",
  description: "New to LA UBF? Plan your visit, learn what to expect, and find ways to connect with our community.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const pageHeroData: PageHeroSectionProps = {
  id: "im-new-hero",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "New here?",
    heading: "We\u2019re glad you\u2019re here.",
    primaryButton: {
      label: "Plan Your Visit",
      href: "#plan-visit",
      visible: true,
    },
    secondaryButton: {
      label: "FREQUENTLY ASKED QUESTIONS",
      href: "#faq",
      visible: true,
    },
    floatingImages: [
      { src: "/images/compressed/i'm%20new/header%20photos/compressed-baptism.jpg", alt: "Baptism", width: 219, height: 146 },
      { src: "/images/compressed/i'm%20new/header%20photos/compressed-beach%20camp.jpg", alt: "Beach camp", width: 186, height: 133 },
      { src: "/images/compressed/i'm%20new/header%20photos/compressed-face%20paint.jpg", alt: "Community event", width: 311, height: 249 },
      { src: "/images/compressed/i'm%20new/header%20photos/compressed-josh.jpg", alt: "Fellowship", width: 133, height: 106 },
      { src: "/images/compressed/i'm%20new/header%20photos/compressed-sports.jpg", alt: "Sports fellowship", width: 216, height: 144 },
      { src: "/images/compressed/i'm%20new/header%20photos/compressed-worship.jpg", alt: "Worship service", width: 288, height: 199 },
    ],
  },
};

const featureBreakdownData: FeatureBreakdownSectionProps = {
  id: "what-is-ubf",
  visible: true,
  colorScheme: "dark",
  content: {
    heading: "What is \u201cUBF\u201d?",
    acronymLines: ["University", "Bible", "Fellowship"],
    description:
      "University Bible Fellowship (UBF) is an international, non-denominational evangelical church centered on Bible study and discipleship. We especially serve college students, raising lifelong disciples of Jesus Christ who love one another and take part in God\u2019s global mission.",
    button: { label: "More about us", href: "/about", visible: true },
  },
};

const pathwayCardData: PathwayCardSectionProps = {
  id: "get-started",
  visible: true,
  colorScheme: "light",
  content: {
    heading: "How to Get Started at LA UBF",
    description:
      "We know visiting a new church can feel intimidating. We want to make your first experience as seamless and welcoming as possible. Here are the best ways to connect with our community.",
    cards: [
      {
        icon: "book-open",
        title: "Join us on Sunday",
        description:
          "Experience our main worship service, gathered in fellowship to praise, study the Word, and grow in faith together through worship.",
        buttonLabel: "Service Info",
        buttonHref: "#what-to-expect",
        buttonVariant: "primary",
      },
      {
        icon: "graduation-cap",
        title: "Are you a College Student?",
        description:
          "Join one of our campus ministries to attend group Bible studies, connect with other students, and grow spiritually during college.",
        buttonLabel: "View Our Campuses",
        buttonHref: "#campus-ministry",
        buttonVariant: "primary",
      },
      {
        icon: "calendar",
        title: "Not sure where to start?",
        description:
          "Start with an upcoming event\u2014an easy way to meet people and explore what LA UBF is all about at your own pace.",
        buttonLabel: "View all events",
        buttonHref: "/events",
        buttonVariant: "secondary",
      },
    ],
  },
};

const timelineData: TimelineSectionProps = {
  id: "what-to-expect",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "SUNDAY SERVICE",
    heading: "What to Expect on Sunday",
    // TODO: add youtube video here
    imageSrc: "/images/compressed/home/compressed-visit-us.jpg",
    imageAlt: "LA UBF church building",
    items: [
      {
        time: "10:00 am",
        title: "Bible Studies & Gathering",
        description:
          "Personal Bible studies take place before worship. Let us know you\u2019re interested and we\u2019ll help you connect.",
      },
      {
        time: "11:00 am",
        title: "Worship Service",
        description:
          "Join us for Sunday worship with a special song, a worship message, and praise together.",
      },
      {
        time: "12:30 pm",
        title: "Lunch & Fellowship",
        description:
          "Stay after service for lunch and fellowship, with food prepared by our community and time to connect.",
      },
    ],
  },
};

const locationDetailData: LocationDetailSectionProps = {
  id: "service-details",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "WHEN & WHERE",
    timeLabel: "Time",
    timeValue: "Every Sunday\n@ 11 AM",
    locationLabel: "Location",
    address: ["11625 Paramount Blvd,", "Downey, CA 90241"],
    directionsUrl:
      "https://maps.google.com/?q=11625+Paramount+Blvd+Downey+CA+90241",
    directionsLabel: "Get Directions",
    images: [
      { src: "/images/compressed/i'm%20new/compressed-laubf-location.png", alt: "LA UBF building exterior" },
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
    ctaButton: { label: "Let us know your interest", href: "#plan-visit" },
  },
};

const formData: FormSectionProps = {
  id: "plan-visit",
  visible: true,
  colorScheme: "dark",
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
        question: "[Mock] Where and when do campus groups meet?",
        answer:
          "Campus Bible study groups meet at various times throughout the week depending on the campus. Most groups meet once or twice a week. Fill out the contact form above and we\u2019ll connect you with the group nearest to you.",
      },
      {
        question: "[Mock] What should I expect on my first Sunday visit?",
        answer:
          "Our Sunday worship service is about 90 minutes and includes praise, prayer, and a sermon. Dress is casual\u2014come as you are. You\u2019re welcome to sit anywhere, and someone from our welcome team will be happy to help you get settled.",
      },
      {
        question: "[Mock] Do I need to know the Bible to attend?",
        answer:
          "Not at all! Many of our members started with little or no Bible knowledge. Our studies are designed to be accessible to everyone, and our leaders are happy to walk alongside you at your own pace.",
      },
      {
        question: "[Mock] Is there parking available at the church?",
        answer:
          "Yes, we have a free parking lot on-site. Street parking is also available on the surrounding blocks. If the lot is full, our parking team can help direct you.",
      },
      {
        question: "[Mock] How can I get connected beyond Sunday service?",
        answer:
          "We\u2019d love for you to join a small group Bible study, attend one of our fellowship events, or serve on a ministry team. Fill out the contact form on this page and we\u2019ll help you find the best next step.",
      },
    ],
  },
};

/* ================================================================
 * I'M NEW PAGE
 * Section order: Light → Brand-2 → Light → Dark → Dark → Light → Dark → Light
 * ================================================================ */

export default function ImNewPage() {
  return (
    <main>
      <PageHeroSection settings={pageHeroData} />
      <FeatureBreakdownSection settings={featureBreakdownData} />
      <PathwayCardSection settings={pathwayCardData} />
      <TimelineSection settings={timelineData} />
      <LocationDetailSection settings={locationDetailData} />
      <CampusCardGridSection settings={campusCardGridData} />
      <FormSection settings={formData} />
      <FAQSection settings={faqData} />
    </main>
  );
}
