import { addDays, addHours, subDays, subMonths, setHours, setMinutes, format } from "date-fns";

export type EventType = "event" | "meeting" | "program";
export type EventStatus = "published" | "draft" | "archived";
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekday' | 'custom';
export type LocationType = "in-person" | "online";

export interface MockEvent {
  id: string;
  title: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  recurrence: {
      pattern: RecurrencePattern;
      interval: number;
      daysOfWeek: string[];
      endOption: 'never' | 'date' | 'after';
      endDate?: Date;
      endOccurrences?: number;
  };
  locationType: LocationType;
  location: string;
  description: string;
  welcomeMessage: string;
  ministry: string;
  contactPeople: string[];
  coverImage: string;
  status: EventStatus;
  registrations: number;
  isPinned?: boolean;
}

const today = new Date();

export const mockEvents: MockEvent[] = [
  {
    id: "1",
    title: "Easter Sunday Service",
    type: "event",
    startDate: new Date("2024-03-31T10:00:00"),
    endDate: new Date("2024-03-31T12:00:00"),
    startTime: "10:00",
    endTime: "12:00",
    recurrence: {
      pattern: 'yearly',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Main Sanctuary",
    description: "<p>Join us for our annual Easter celebration service with special music and a message of hope. The choir will be performing selections from Handel's Messiah, and there will be an egg hunt for the kids immediately following the service.</p>",
    welcomeMessage: "First time? We'd love to meet you at the Welcome Center!",
    ministry: "Worship",
    contactPeople: ["Pastor John", "Sarah Smith"],
    coverImage: "https://images.unsplash.com/photo-1681048056777-a022e84ea167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2h8ZW58MXx8fHwxNzY4ODY3MDc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 450,
    isPinned: true
  },
  {
    id: "2",
    title: "Youth Group Friday Night",
    type: "program",
    startDate: setHours(addDays(today, (5 - today.getDay() + 7) % 7), 19), // Next Friday
    endDate: setHours(addDays(today, (5 - today.getDay() + 7) % 7), 21),
    startTime: "19:00",
    endTime: "21:00",
    recurrence: {
      pattern: 'weekly',
      interval: 1,
      daysOfWeek: ['5'], // Friday
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Youth Hall",
    description: "<p>Calling all high school students! Join us for a night of games, worship, and small group discussions. Pizza will be provided.</p>",
    welcomeMessage: "New to Youth Group? Find a leader wearing a blue shirt!",
    ministry: "Youth",
    contactPeople: ["Mike Jones", "Emily Davis"],
    coverImage: "https://images.unsplash.com/photo-1758272959994-f1a4beffa257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGdyb3VwJTIwdGVlbnMlMjBoYW5naW5nJTIwb3V0fGVufDF8fHx8MTc2ODg2NzA3NHww&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 35
  },
  {
    id: "3",
    title: "Elders Meeting",
    type: "meeting",
    startDate: addDays(today, 2),
    endDate: addDays(today, 2),
    startTime: "18:30",
    endTime: "20:30",
    recurrence: {
      pattern: 'monthly',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Conference Room B",
    description: "<p>Monthly meeting for the board of elders to discuss church business, finances, and pastoral care needs.</p>",
    welcomeMessage: "",
    ministry: "Leadership",
    contactPeople: ["Pastor John"],
    coverImage: "", // No image for internal meeting
    status: "draft",
    registrations: 8
  },
  {
    id: "4",
    title: "Christmas Eve Candlelight Service",
    type: "event",
    startDate: new Date("2023-12-24T18:00:00"),
    endDate: new Date("2023-12-24T19:30:00"),
    startTime: "18:00",
    endTime: "19:30",
    recurrence: {
      pattern: 'yearly',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Main Sanctuary",
    description: "<p>A beautiful service of lessons and carols, culminating in the lighting of candles as we celebrate the birth of our Savior.</p>",
    welcomeMessage: "Hot cocoa will be served in the lobby afterwards.",
    ministry: "Worship",
    contactPeople: ["Sarah Smith"],
    coverImage: "https://images.unsplash.com/photo-1641510491720-89892632c600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHJpc3RtYXMlMjBjYW5kbGVsaWdodCUyMHNlcnZpY2V8ZW58MXx8fHwxNzY4ODY3MDc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 600
  },
  {
    id: "5",
    title: "Community Outreach: Food Bank",
    type: "program",
    startDate: addDays(today, 5),
    endDate: addDays(today, 5),
    startTime: "09:00",
    endTime: "13:00",
    recurrence: {
      pattern: 'monthly',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "City Community Center",
    description: "<p>We will be sorting and distributing food to families in need. Please wear comfortable closed-toe shoes and the church t-shirt if you have one.</p>",
    welcomeMessage: "Park in the back lot and enter through the volunteer door.",
    ministry: "Outreach",
    contactPeople: ["David Wilson"],
    coverImage: "https://images.unsplash.com/photo-1755718669919-9a3db492d8f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBvdXRyZWFjaCUyMHZvbHVudGVlcnMlMjBmb29kJTIwYmFua3xlbnwxfHx8fDE3Njg4NjcwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 22
  },
  {
    id: "6",
    title: "Midweek Bible Study",
    type: "program",
    startDate: setHours(addDays(today, (3 - today.getDay() + 7) % 7), 10), // Next Wednesday
    endDate: setHours(addDays(today, (3 - today.getDay() + 7) % 7), 11),
    startTime: "10:00",
    endTime: "11:30",
    recurrence: {
      pattern: 'weekly',
      interval: 1,
      daysOfWeek: ['3'], // Wednesday
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Fellowship Hall",
    description: "<p>An in-depth study of the book of Romans. Coffee and pastries provided.</p>",
    welcomeMessage: "",
    ministry: "Education",
    contactPeople: ["Pastor Mary"],
    coverImage: "https://images.unsplash.com/photo-1630011041146-04d179c6e215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWJsZSUyMHN0dWR5JTIwZ3JvdXAlMjBjb2ZmZWV8ZW58MXx8fHwxNzY4ODY3MDc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 45
  },
  {
    id: "7",
    title: "Sanctuary Choir Practice",
    type: "program",
    startDate: setHours(addDays(today, (4 - today.getDay() + 7) % 7), 19), // Next Thursday
    endDate: setHours(addDays(today, (4 - today.getDay() + 7) % 7), 21),
    startTime: "19:00",
    endTime: "21:00",
    recurrence: {
      pattern: 'weekly',
      interval: 1,
      daysOfWeek: ['4'],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Music Room",
    description: "<p>Rehearsal for Sunday service and upcoming special events. New members welcome!</p>",
    welcomeMessage: "",
    ministry: "Worship",
    contactPeople: ["Director Sarah"],
    coverImage: "https://images.unsplash.com/photo-1745852738233-bbd0df06c279?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9pciUyMHNpbmdpbmclMjBjaHVyY2h8ZW58MXx8fHwxNzY4ODY3MDc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 30
  },
  {
    id: "8",
    title: "Monthly Prayer Gathering",
    type: "meeting",
    startDate: addDays(today, 10),
    endDate: addDays(today, 10),
    startTime: "20:00",
    endTime: "21:00",
    recurrence: {
      pattern: 'monthly',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "online",
    location: "Online",
    description: "<p>Join us on Zoom for a time of corporate prayer for our church, community, and world.</p>",
    welcomeMessage: "Link will be sent 1 hour before.",
    ministry: "Prayer",
    contactPeople: ["Prayer Team"],
    coverImage: "https://images.unsplash.com/photo-1766074903100-bc435aa4c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBtZWV0aW5nJTIwem9vbSUyMGNhbGwlMjBsYXB0b3B8ZW58MXx8fHwxNzY4ODY3MDc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "published",
    registrations: 120
  },
  {
    id: "9",
    title: "Vision Night 2027",
    type: "event",
    startDate: new Date("2027-01-15T19:00:00"),
    endDate: new Date("2027-01-15T21:00:00"),
    startTime: "19:00",
    endTime: "21:00",
    recurrence: {
      pattern: 'none',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Main Sanctuary",
    description: "<p>Looking forward to the future of our church. Join us as we cast vision for the next 5 years.</p>",
    welcomeMessage: "",
    ministry: "Leadership",
    contactPeople: ["Pastor John"],
    coverImage: "https://images.unsplash.com/photo-1762967021678-175442c10c0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZSUyMG1vZGVybnxlbnwxfHx8fDE3Njg4NjcwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "draft",
    registrations: 0,
    isPinned: true
  },
  {
    id: "10",
    title: "Legacy Dinner 2022",
    type: "event",
    startDate: new Date("2022-11-20T18:00:00"),
    endDate: new Date("2022-11-20T20:30:00"),
    startTime: "18:00",
    endTime: "20:30",
    recurrence: {
      pattern: 'none',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never'
    },
    locationType: "in-person",
    location: "Fellowship Hall",
    description: "<p>Celebrating 50 years of ministry.</p>",
    welcomeMessage: "",
    ministry: "Outreach",
    contactPeople: ["Martha Stewart"],
    coverImage: "https://images.unsplash.com/photo-1732850714203-d40cd333968e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjBwb3RsdWNrJTIwZm9vZHxlbnwxfHx8fDE3Njg4NjcwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "archived",
    registrations: 150
  }
];
