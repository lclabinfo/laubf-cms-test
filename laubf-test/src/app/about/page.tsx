import TextImageHeroSection from "@/components/sections/TextImageHeroSection";
import AboutDescriptionSection from "@/components/sections/AboutDescriptionSection";
import PillarsSection from "@/components/sections/PillarsSection";
import StatementSection from "@/components/sections/StatementSection";
import PathwayCardSection from "@/components/sections/PathwayCardSection";
import NewcomerSection from "@/components/sections/NewcomerSection";

import type {
  TextImageHeroSectionProps,
  AboutDescriptionSectionProps,
  PillarsSectionProps,
  StatementSectionProps,
  PathwayCardSectionProps,
  NewcomerSectionProps,
} from "@/lib/types/sections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about LA UBF — our mission, values, and community of faith on college campuses across Los Angeles.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const textImageHeroData: TextImageHeroSectionProps = {
  id: "who-we-are-hero",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "WHO WE ARE",
    headingLine1: "Christian Ministry for",
    headingAccent: "College Students +",
    description:
      "Our main focus is to study the Bible and grow in the grace and knowledge of Jesus Christ as his disciples.",
    image: {
      src: "/images/compressed/who%20we%20are/compressed-header.jpg",
      alt: "LA UBF community gathering",
    },
  },
};

const aboutDescriptionData: AboutDescriptionSectionProps = {
  id: "about-ubf",
  visible: true,
  colorScheme: "dark",
  content: {
    logoSrc: "/logo/laubf-logo-blue.svg",
    heading: "About UBF",
    description:
      "University Bible Fellowship (UBF) is an international evangelical church (non-denominational) dedicated to Christ and his kingdom. Our main focus is to study the Bible, grow in the grace and knowledge of our Lord and Savior Jesus Christ, and live according to his teachings as his disciples. We especially pray to reach college students and help them grow as his lifelong disciples. Our goal is to obey our Lord\u2019s commands to love one another and to go and make disciples of all nations (Jn 13:34; Mt 28:18-20). We pray that God may continue to call and raise lay missionaries through us and send them to the ends of the earth (Ac 1:8).",
    videoUrl: "https://www.youtube.com/embed/WqeW4HtM06M",
    videoTitle: "Describe UBF in 3 Words",
  },
};

const pillarsData: PillarsSectionProps = {
  id: "what-we-do",
  visible: true,
  colorScheme: "dark",
  content: {
    overline: "WHAT WE DO",
    heading: "The 3 Pillars of LA UBF",
    items: [
      {
        title: "Bible Study",
        description:
          "We help students study the Bible so they may come to know God personally, understand themselves, and find purpose in Jesus Christ. Bible studies are offered one-to-one with a mentor or in small groups centered around campuses and shared interests.",
        images: [
          { src: "/images/compressed/who%20we%20are/compressed-bible%20study.jpg", alt: "Bible study session" },
        ],
      },
      {
        title: "Discipleship",
        description:
          "We walk with students as they grow as disciples of Jesus through shared life and discipleship training. Our goal is to equip students to mature in faith and become disciple makers who help others follow Christ.",
        images: [
          { src: "/images/compressed/who%20we%20are/compressed-discipleship.jpg", alt: "Discipleship gathering" },
        ],
      },
      {
        title: "Fellowship",
        description:
          "Fellowship is an essential part of our faith as we support and encourage one another in community. We share fellowship through Sunday worship, activities, and retreats as we grow together in Christ.",
        images: [
          { src: "/images/compressed/who%20we%20are/compressed-fellowship.jpg", alt: "Fellowship meal" },
        ],
      },
    ],
  },
};

const statementData: StatementSectionProps = {
  id: "what-we-believe",
  visible: true,
  colorScheme: "light",
  content: {
    overline: "STATEMENT OF FAITH",
    heading: "What We Believe",
    showIcon: true,
    leadIn: "We believe that",
    paragraphs: [
      {
        text: "there is one God in three Persons: God the Father, God the Son, and God the Holy Spirit.",
        isBold: true,
      },
      {
        text: "God created the heavens and the earth and all other things in the universe; that He is the Sovereign Ruler of all things; that the Sovereign God reveals Himself; we believe in his redemptive work and in his final judgment.",
        isBold: false,
      },
      {
        text: "the Bible is inspired by God; that it is the truth; that it is the final authority in faith and practice.",
        isBold: false,
      },
      {
        text: "since the fall of Adam, all people have been under the bondage and power of sin and are deserving of the judgment and wrath of God.",
        isBold: false,
      },
      {
        text: "Jesus Christ, who is God and man, through his atoning, sacrificial death on the cross for our sins and his resurrection, is the only way of salvation; he alone saves us from sin and judgment and purifies us from the contamination of the world caused by sin",
        isBold: false,
      },
    ],
  },
};

const pathwayCardData: PathwayCardSectionProps = {
  id: "get-started",
  visible: true,
  colorScheme: "light",
  content: {
    heading: "How to Get Started at LA UBF",
    description:
      "We know that visiting a new church can be intimidating. We want to make your first experience as seamless and welcoming as possible. Here are the some best ways to connect with our community.",
    cards: [
      {
        icon: "book-open",
        title: "Join us on Sunday",
        description:
          "Experience our main worship service, where we gather to listen to the sermon and learn through the Word of God together.",
        buttonLabel: "Service Info",
        buttonHref: "/im-new#what-to-expect",
        buttonVariant: "primary",
      },
      {
        icon: "graduation-cap",
        title: "Are you a College Student?",
        description:
          "Join one of our campus ministries to attend group Bible studies and grow in faith alongside fellow students.",
        buttonLabel: "View Our Campuses",
        buttonHref: "/im-new#campus-ministry",
        buttonVariant: "primary",
      },
      {
        icon: "calendar",
        title: "Not sure where to start?",
        description:
          "Start with an upcoming event\u2014an easy way to join and get to know our community.",
        buttonLabel: "View all events",
        buttonHref: "/events",
        buttonVariant: "secondary",
      },
    ],
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
 * WHO WE ARE PAGE
 * Section order: Light → Dark → Light → Light → Light
 * ================================================================ */

export default function AboutPage() {
  return (
    <main>
      <TextImageHeroSection settings={textImageHeroData} />
      <AboutDescriptionSection settings={aboutDescriptionData} />
      <PillarsSection settings={pillarsData} />
      <StatementSection settings={statementData} />
      <NewcomerSection settings={newcomerData} />
    </main>
  );
}
