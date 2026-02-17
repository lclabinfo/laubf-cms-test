import { addDays, subDays } from "date-fns";

export type AnnouncementStatus = "draft" | "scheduled" | "published" | "archived";
export type AnnouncementCategory = "general" | "urgent" | "news" | "event";

export interface Attachment {
    id: string;
    type: "file" | "link";
    name: string;
    url: string;
}

export interface EmailLog {
    id: string;
    sentDate: Date;
    subject: string;
    recipients: string;
    recipientCount: number;
    status: "sent" | "scheduled" | "failed";
    openRate?: number;
}

export interface MockAnnouncement {
    id: string;
    title: string;
    content: string; // HTML string
    category: AnnouncementCategory;
    ministry: string; // Changed from targetAudience
    status: AnnouncementStatus;
    publishDate: Date;
    author: string;
    showAuthor: boolean;
    isPinned: boolean;
    attachments: Attachment[];
    
    emailLogs: EmailLog[];
    
    views: number;
    clicks: number;
}

const today = new Date();

export const mockAnnouncements: MockAnnouncement[] = [
    {
        id: "1",
        title: "Annual Business Meeting Postponed",
        content: "<p>Due to severe weather conditions forecast for this weekend, the Annual Business Meeting has been rescheduled.</p>",
        category: "urgent",
        ministry: "Church Wide",
        status: "published",
        publishDate: subDays(today, 1),
        author: "Board of Elders",
        showAuthor: true,
        isPinned: true,
        attachments: [],
        emailLogs: [
            {
                id: "e1",
                sentDate: subDays(today, 1),
                subject: "URGENT: Business Meeting Change",
                recipients: "All Members",
                recipientCount: 450,
                status: "sent",
                openRate: 65
            }
        ],
        views: 450,
        clicks: 320
    },
    {
        id: "2",
        title: "Welcome New Youth Pastor",
        content: "<p>We are excited to announce that Mike Jones has joined our staff as the new Youth Pastor. Please give him a warm welcome!</p><img src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60' alt='Mike Jones' />",
        category: "news",
        ministry: "Youth",
        status: "published",
        publishDate: subDays(today, 5),
        author: "Pastor John",
        showAuthor: true,
        isPinned: false,
        attachments: [],
        emailLogs: [
             {
                id: "e2",
                sentDate: subDays(today, 5),
                subject: "Welcome Pastor Mike!",
                recipients: "All Members",
                recipientCount: 890,
                status: "sent",
                openRate: 72
            }
        ],
        views: 890,
        clicks: 120
    },
    {
        id: "3",
        title: "VBS Volunteer Sign-ups Open",
        content: "<p>Vacation Bible School is around the corner! We need over 50 volunteers to make this happen. Sign up today.</p>",
        category: "event",
        ministry: "Kids",
        status: "scheduled",
        publishDate: addDays(today, 2),
        author: "Sarah Smith",
        showAuthor: false,
        isPinned: false,
        attachments: [
            { id: "a2", type: "link", name: "Sign Up Form", url: "https://forms.google.com/..." }
        ],
        emailLogs: [],
        views: 0,
        clicks: 0
    },
    {
        id: "4",
        title: "Q1 Financial Update",
        content: "<p>The financial report for the first quarter of the year is now available for review by all members.</p>",
        category: "general",
        ministry: "Finance",
        status: "draft",
        publishDate: today,
        author: "Finance Team",
        showAuthor: true,
        isPinned: false,
        attachments: [
            { id: "a3", type: "file", name: "Q1-Report.pdf", url: "#" }
        ],
        emailLogs: [],
        views: 0,
        clicks: 0
    },
    {
        id: "5",
        title: "Worship Team Auditions",
        content: "<p>Interested in joining the worship team? Auditions will be held next Tuesday in the main sanctuary.</p>",
        category: "general",
        ministry: "Worship",
        status: "published",
        publishDate: subDays(today, 10),
        author: "Director Sarah",
        showAuthor: true,
        isPinned: false,
        attachments: [],
        emailLogs: [],
        views: 120,
        clicks: 15
    },
    {
        id: "6",
        title: "Building Fund Pledge Cards Due",
        content: "<p>Reminder to turn in your pledge cards for the new building project by this Sunday.</p>",
        category: "general",
        ministry: "Church Wide",
        status: "archived",
        publishDate: subDays(today, 30),
        author: "Building Committee",
        showAuthor: false,
        isPinned: false,
        attachments: [],
        emailLogs: [
             {
                id: "e3",
                sentDate: subDays(today, 30),
                subject: "Reminder: Pledge Cards",
                recipients: "All Members",
                recipientCount: 300,
                status: "sent",
                openRate: 45
            },
            {
                id: "e4",
                sentDate: subDays(today, 35),
                subject: "Building Fund Update",
                recipients: "All Members",
                recipientCount: 295,
                status: "sent",
                openRate: 50
            }
        ],
        views: 300,
        clicks: 45
    }
];
