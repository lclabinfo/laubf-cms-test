import {
  LayoutDashboardIcon,
  ChurchIcon,
  BookOpenIcon,
  VideoIcon,
  FileUpIcon,
  PaperclipIcon,
  CalendarIcon,
  UsersIcon,
  GlobeIcon,
  ImageIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"

export interface TutorialStep {
  icon: LucideIcon
  title: string
  description: string
}

export interface TutorialDef {
  id: string
  title: string
  steps: TutorialStep[]
}

export const TUTORIALS: Record<string, TutorialDef> = {
  overview: {
    id: "overview",
    title: "Welcome to your CMS",
    steps: [
      {
        icon: SparklesIcon,
        title: "Welcome to your Church CMS",
        description:
          "This is your central hub for managing everything about your church — from sermons and events to your public website. Let's take a quick tour of the main areas.",
      },
      {
        icon: ChurchIcon,
        title: "Church Profile",
        description:
          "Set up your church's basic information — name, address, service times, contact info, and social media links. This information appears across your website.",
      },
      {
        icon: BookOpenIcon,
        title: "Bible Studies & Messages",
        description:
          "Manage your sermons and bible study content. Each message can have a video recording and/or a written bible study. You can upload Word documents (.doc, .docx) for study content and add YouTube or uploaded videos.",
      },
      {
        icon: CalendarIcon,
        title: "Events",
        description:
          "Create and manage church events — worship services, fellowships, conferences, and more. Set dates, times, locations, and descriptions that appear on your website's events page.",
      },
      {
        icon: ImageIcon,
        title: "Media Library",
        description:
          "Upload and organize images and files in folders. Media you upload here can be used across your messages, events, and website pages.",
      },
      {
        icon: UsersIcon,
        title: "People & Members",
        description:
          "Keep track of your church community. People management features are still being developed — you'll soon be able to organize members into groups, ministries, and campuses.",
      },
      {
        icon: GlobeIcon,
        title: "Website Builder",
        description:
          "Edit and customize your church's public website directly from the CMS. The website builder is being developed and will let you manage pages, navigation, themes, and more — all without writing code.",
      },
      {
        icon: LayoutDashboardIcon,
        title: "Your Dashboard",
        description:
          "The dashboard gives you a quick overview of your content health, recent activity, and upcoming events. You can always come back here to see how your church's digital presence is doing.",
      },
    ],
  },

  "church-profile": {
    id: "church-profile",
    title: "Church Profile",
    steps: [
      {
        icon: ChurchIcon,
        title: "Your Church Profile",
        description:
          "This is where you manage your church's identity. Update your church name, denomination, description, and founding year. This information is used across your website.",
      },
      {
        icon: ChurchIcon,
        title: "Location & Contact",
        description:
          "Add your church's physical address, phone number, and email. If you have multiple locations, you can manage campuses from the People section.",
      },
      {
        icon: ChurchIcon,
        title: "Service Times & Social Media",
        description:
          "Set your regular worship service times so visitors know when to come. You can also link your social media accounts (Facebook, Instagram, YouTube, etc.) to display on your website.",
      },
    ],
  },

  messages: {
    id: "messages",
    title: "Bible Studies & Messages",
    steps: [
      {
        icon: BookOpenIcon,
        title: "Messages Overview",
        description:
          "This is where all your sermons and bible studies live. Each \"message\" represents a single teaching — it can contain a video recording, a written bible study, or both.",
      },
      {
        icon: VideoIcon,
        title: "Video Messages",
        description:
          "Add sermon recordings by pasting a YouTube URL or uploading a video file. Videos appear on your website's messages page. Note: automatic live transcription is not yet available but is coming soon.",
      },
      {
        icon: BookOpenIcon,
        title: "Bible Studies",
        description:
          "Bible studies are the written study content — questions, answers, and life application notes. You can type them directly in the editor or upload a Word document (.doc or .docx) to auto-import the content.",
      },
      {
        icon: FileUpIcon,
        title: "Uploading Documents",
        description:
          "To upload a study document, open a message and look for the document upload area in the Bible Study tab. Supported formats: .doc and .docx (Word documents). The content will be automatically converted and imported into the editor.",
      },
      {
        icon: PaperclipIcon,
        title: "Attachments",
        description:
          "Each message can have file attachments (PDFs, documents, etc.) that visitors can download from your website. You'll find the attachments section at the bottom of the message editor page.",
      },
    ],
  },

  events: {
    id: "events",
    title: "Events",
    steps: [
      {
        icon: CalendarIcon,
        title: "Managing Events",
        description:
          "Create events for your church — worship services, bible study meetings, fellowships, retreats, conferences, and more. Each event appears on your website's events page.",
      },
      {
        icon: CalendarIcon,
        title: "Event Details",
        description:
          "Set the event title, date, time, location (in-person or online), and a description. You can also add a cover image and categorize events by type (worship, fellowship, outreach, etc.).",
      },
      {
        icon: CalendarIcon,
        title: "List & Calendar Views",
        description:
          "Switch between list view and calendar view using the toggle at the top. List view shows events sorted by date, while calendar view gives you a monthly overview of all events.",
      },
    ],
  },

  media: {
    id: "media",
    title: "Media Library",
    steps: [
      {
        icon: ImageIcon,
        title: "Your Media Library",
        description:
          "Upload and organize images, videos, and documents. Everything you upload here can be used across your messages, events, and website pages.",
      },
      {
        icon: ImageIcon,
        title: "Folders & Organization",
        description:
          "Create folders to keep your media organized — for example, separate folders for event photos, sermon graphics, and website images. You can drag and drop files between folders.",
      },
      {
        icon: ImageIcon,
        title: "Uploading Files",
        description:
          "Drag and drop files onto the page or click the upload button. Supported formats include images (JPG, PNG, WebP), videos (MP4), and documents (PDF, DOC). Files are stored securely in the cloud.",
      },
    ],
  },

  people: {
    id: "people",
    title: "People & Members",
    steps: [
      {
        icon: UsersIcon,
        title: "People Management",
        description:
          "This section helps you keep track of your church community — members, visitors, and staff. You can view and manage people records here.",
      },
      {
        icon: UsersIcon,
        title: "Coming Soon",
        description:
          "We're still building out the full people management features — including groups, ministries, and campus assignments. For now, you can view and edit basic member information. More features are on the way!",
      },
    ],
  },

  website: {
    id: "website",
    title: "Website Builder",
    steps: [
      {
        icon: GlobeIcon,
        title: "Your Church Website",
        description:
          "The website builder lets you manage your church's public-facing website. You can edit pages, customize the design, and publish changes — all without any coding.",
      },
      {
        icon: GlobeIcon,
        title: "Coming Soon",
        description:
          "The full website builder experience is still being developed. Soon you'll be able to drag-and-drop sections, edit content inline, customize colors and fonts, and manage your site navigation — all from this page.",
      },
    ],
  },
}
