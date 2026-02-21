import type { LucideIcon } from "lucide-react";
import {
  Info,
  MapPin,
  Youtube,
  Calendar,
  Megaphone,
  Heart,
  GraduationCap,
  Users,
  Landmark,

  Baby,
  Video,
  BookOpen,
  BookText,
  MonitorPlay,
  Radio,
  HandHeart,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavSubItem {
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavSubItem[];
  columns?: number;
  width?: string;
  /** Compact mode: hides icons, smaller text, external arrow on hover only */
  compact?: boolean;
  footerLink?: {
    label: string;
    href: string;
  };
}

export interface NavDropdown {
  id: string;
  label: string;
  href?: string;
  /** CSS translate-x offset for the dropdown panel (e.g. "10%" to shift right) */
  offsetX?: string;
  sections: NavSection[];
  featuredCard?: {
    image: string;
    imageAlt: string;
    title: string;
    description: string;
    href: string;
  };
  overviewLink?: {
    label: string;
    description: string;
    href: string;
  };
}

export const dropdowns: NavDropdown[] = [
  {
    id: "our-church",
    label: "Our Church",
    offsetX: "-35%",
    sections: [
      {
        title: "About",
        items: [
          {
            label: "Who We Are",
            description: "Our mission & vision",
            href: "/about",
            icon: Info,
          },
          {
            label: "I'm New",
            description: "Plan your visit",
            href: "/im-new",
            icon: MapPin,
          },
        ],
      },
      {
        title: "Connect",
        items: [
          {
            label: "Events",
            href: "/events?tab=event",
            icon: Calendar,
          },
          {
            label: "Meetings",
            href: "/events?tab=meeting",
            icon: Users,
          },
          {
            label: "Programs",
            href: "/events?tab=program",
            icon: BookOpen,
          },
          // {
          //   label: "Livestream",
          //   description: "Sunday worship",
          //   href: "https://youtube.com/@laubf",
          //   icon: Youtube,
          //   external: true,
          // },
          // {
          //   label: "Announcements",
          //   description: "Latest updates",
          //   href: "/announcements",
          //   icon: Megaphone,
          // },
          // {
          //   label: "Prayer",
          //   description: "Prayer requests",
          //   href: "/prayer",
          //   icon: Heart,
          // },
        ],
      },
      {
        title: "Quick Links",
        compact: true,
        items: [
          {
            label: "Daily Bread & Prayer",
            description: "Mon–Fri @ 6 AM",
            href: "https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09",
            icon: BookOpen,
            external: true,
          },
          {
            label: "Evening Prayer",
            description: "Every Day @ 7:30 PM",
            href: "https://meet.google.com/pgm-trah-moc",
            icon: HandHeart,
            external: true,
          },
          {
            label: "Men's Bible Study",
            description: "Sat @ 8 AM",
            href: "https://zoom.us",
            icon: Users,
            external: true,
          },
          {
            label: "Sunday Livestream",
            description: "Sun @ 11 AM",
            href: "https://www.youtube.com/@LAUBF/streams",
            icon: Radio,
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "ministries",
    label: "Ministries",
    href: "/ministries",
    sections: [
      {
        title: "Ministry Groups",
        items: [
          {
            label: "College & Young Adults",
            href: "/ministries/college",
            icon: GraduationCap,
          },
          {
            label: "Adults",
            href: "/ministries/adults",
            icon: Users,
          },
          {
            label: "Middle & High School (JBF & HBF)",
            href: "/ministries/high-school",
            icon: Landmark,
          },
          {
            label: "Children (BBF & CBF)",
            href: "/ministries/children",
            icon: Baby,
          },
        ],
      },
      {
        title: "Campus Ministries",
        columns: 2,
        items: [
          {
            label: "LBCC",
            description: "Long Beach City College",
            href: "/ministries/campus/lbcc",
            icon: MapPin,
          },
          {
            label: "CSULB",
            description: "Cal State Long Beach",
            href: "/ministries/campus/csulb",
            icon: MapPin,
          },
          {
            label: "CSUF",
            description: "Cal State Fullerton",
            href: "/ministries/campus/csuf",
            icon: MapPin,
          },
          {
            label: "UCLA",
            description: "University of California, Los Angeles",
            href: "/ministries/campus/ucla",
            icon: MapPin,
          },
          {
            label: "USC",
            description: "University of Southern California",
            href: "/ministries/campus/usc",
            icon: MapPin,
          },
          {
            label: "CSUDH",
            description: "Cal State Dominguez Hills",
            href: "/ministries/campus/csudh",
            icon: MapPin,
          },
          {
            label: "CCC",
            description: "Cerritos Community College",
            href: "/ministries/campus/ccc",
            icon: MapPin,
          },
          {
            label: "MT. SAC",
            description: "Mt. San Antonio College",
            href: "/ministries/campus/mt-sac",
            icon: MapPin,
          },
          {
            label: "Golden State",
            description: "Golden West College",
            href: "/ministries/campus/golden-west",
            icon: MapPin,
          },
          {
            label: "Cypress College",
            href: "/ministries/campus/cypress",
            icon: MapPin,
          },
          {
            label: "Cal Poly Pomona",
            href: "/ministries/campus/cal-poly-pomona",
            icon: MapPin,
          },
        ],
      },
    ],
    overviewLink: {
      label: "Ministry Overview",
      description: "Learn about the ministries that shape our community",
      href: "/ministries",
    },
  },
  {
    id: "resources",
    label: "Resources",
    sections: [
      {
        title: "The Word",
        items: [
          {
            label: "Messages",
            // description: "Sermon Videos",
            href: "/messages",
            icon: Video,
          },
          {
            label: "Bible Studies",
            // description: "Study Questions",
            href: "/bible-study",
            icon: BookOpen,
          },
          {
            label: "Daily Bread",
            // description: "Daily Devotionals",
            href: "/daily-bread",
            icon: BookText,
          },
        ],
      },
      {
        title: "Media",
        items: [
          {
            label: "Videos",
            href: "/videos",
            icon: MonitorPlay,
          },
        ],
      },
    ],
  },
];

export const directLinks: NavLink[] = [
  { label: "Giving", href: "/giving" },
];
