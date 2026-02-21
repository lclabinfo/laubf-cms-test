import type { Metadata } from "next";
import { DM_Serif_Display } from "next/font/google";
import { Agentation } from "agentation";
import Navbar from "@/components/layout/Navbar";
import QuickLinksFAB from "@/components/layout/QuickLinksFAB";
import FooterSection from "@/components/sections/FooterSection";
import type {
  NavbarSettings,
  FooterSectionProps,
  QuickLinksFABSettings,
} from "@/lib/types/sections";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-serif-display",
});

export const metadata: Metadata = {
  title: {
    default: "LA UBF",
    template: "%s | LA UBF",
  },
  description:
    "LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.",
  metadataBase: new URL("https://laubf.org"),
  openGraph: {
    type: "website",
    siteName: "LA UBF",
    locale: "en_US",
    description:
      "A Bible-centered community raising lifelong disciples on college campuses and beyond.",
  },
  twitter: {
    card: "summary",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const navbarSettings: NavbarSettings = {
  id: "navbar",
  visible: true,
  colorScheme: "dark",
  content: {
    logo: {
      lightSrc: "/logo/laubf-logo.svg",
      darkSrc: "/logo/laubf-logo-blue.svg",
      alt: "LA UBF",
    },
    ctaButton: {
      label: "I\u2019m new",
      href: "/im-new",
      visible: true,
    },
    memberLogin: {
      label: "Member Login",
      href: "/member-login",
      visible: false,
    },
  },
};

const quickLinksFABSettings: QuickLinksFABSettings = {
  visible: true,
  content: {
    title: "Quick Links",
    links: [
      {
        label: "Daily Bread & Prayer",
        href: "https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09",
        icon: "book-open",
        description: "Mon\u2013Fri @ 6 AM",
      },
      {
        label: "Evening Prayer",
        href: "https://meet.google.com/pgm-trah-moc",
        icon: "hand-heart",
        description: "Every Day @ 7:30 PM",
      },
      {
        label: "Men\u2019s Bible Study",
        href: "https://zoom.us",
        icon: "users",
        description: "Sat @ 8 AM",
      },
      {
        label: "Sunday Livestream",
        href: "https://www.youtube.com/@LAUBF/streams",
        icon: "radio",
        description: "Sun @ 11 AM",
      },
    ],
  },
};

const footerData: FooterSectionProps = {
  id: "footer",
  visible: true,
  colorScheme: "dark",
  content: {
    description:
      "A Bible-centered community raising lifelong disciples on campus and beyond.",
    socialLinks: [
      { platform: "instagram", href: "https://instagram.com/la.ubf" },
      { platform: "facebook", href: "https://facebook.com/losangelesubf" },
      { platform: "youtube", href: "https://youtube.com/@laubf" },
    ],
    columns: [
      {
        heading: "EXPLORE",
        links: [
          { label: "About Us", href: "/about" },
          { label: "I'm New", href: "/im-new" },
          { label: "Ministries", href: "/ministries" },
          { label: "Events", href: "/events" },
          { label: "Messages", href: "/messages" },
          { label: "Giving", href: "/giving" },
        ],
      },
      {
        heading: "RESOURCES",
        links: [
          {
            label: "UBF HQ",
            href: "https://ubf.org/",
            external: true,
          },
          {
            label: "Chicago UBF",
            href: "https://www.chicagoubf.org/",
            external: true,
          },
          {
            label: "Korea UBF",
            href: "https://www.ubf.kr/",
            external: true,
          },
          {
            label: "UBF HQ YouTube",
            href: "https://www.youtube.com/user/ubfwebdev",
            external: true,
          },
          {
            label: "LA UBF YouTube",
            href: "https://www.youtube.com/channel/UCj419CtzNGrJ-1vtT2-DCQw",
            external: true,
          },
          {
            label: "Daily Bread YouTube",
            href: "https://www.youtube.com/c/ubfdailybread",
            external: true,
          },
        ],
      },
    ],
    contactInfo: {
      address: ["11625 Paramount Blvd", "Downey, CA 90241"],
      phone: "(562) 396-6350",
      email: "laubf.downey@gmail.com",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} overflow-x-clip`}>
      <body className="bg-white-1 text-black-1 font-sans antialiased">
        <Navbar settings={navbarSettings} />
        {children}
        <QuickLinksFAB settings={quickLinksFABSettings} />
        <FooterSection settings={footerData} />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
