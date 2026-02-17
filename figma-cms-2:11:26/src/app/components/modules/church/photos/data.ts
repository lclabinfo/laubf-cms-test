
export interface MediaFolder {
    id: string;
    name: string;
    count: number;
    type?: 'local' | 'google';
    coverUrl?: string;
    externalUrl?: string;
    status?: 'Connected' | 'Disconnected' | 'Syncing' | 'Used' | 'Unused';
    lastSynced?: string;
    lastModified?: string; // ISO Date
}

export type MediaType = "JPG" | "PNG" | "WEBP" | "YOUTUBE" | "VIMEO";

export interface MediaItem {
    id: string;
    url: string; // Thumbnail for video, image url for photo
    name: string;
    date: string;
    folderId: string;
    size?: string;
    type: MediaType;
    // Video specific
    videoUrl?: string;
    originalTitle?: string;
    tags?: string[];
    lastModified?: string; // ISO Date
}

export const mockFolders: MediaFolder[] = [
    { id: "all", name: "All Media", count: 12, lastModified: "2024-01-01" },
    { id: "sunday-service", name: "Sunday Service", count: 5, lastModified: "2024-03-10" },
    { id: "youth-camp", name: "Youth Camp 2024", count: 4, lastModified: "2024-03-05" },
    { id: "community", name: "Community Events", count: 3, lastModified: "2024-02-20" },
    { id: "worship", name: "Worship Videos", count: 2, lastModified: "2024-01-15" },
];

export const mockMedia: MediaItem[] = [
    {
        id: "1",
        url: "https://images.unsplash.com/photo-1712260559341-cbe284e828b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZSUyMGNvbmNlcnQlMjBsaWdodGluZ3xlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Worship Service.jpg",
        date: "2024-03-10",
        lastModified: "2024-03-12",
        folderId: "sunday-service",
        size: "2.4 MB",
        type: "JPG"
    },
    {
        id: "2",
        url: "https://images.unsplash.com/photo-1765582870011-ff3cfdb06700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkaW5uZXIlMjBmcmllbmRzJTIwZWF0aW5nJTIwdGFibGV8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Community Dinner.jpg",
        date: "2024-03-08",
        lastModified: "2024-03-09",
        folderId: "community",
        size: "3.1 MB",
        type: "JPG"
    },
    {
        id: "3",
        url: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlcnMlMjB5b3V0aCUyMGdyb3VwJTIwdGFsa2luZyUyMGxhdWdoaW5nfGVufDF8fHx8MTc2OTUwMjE0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Youth Group.jpg",
        date: "2024-03-05",
        lastModified: "2024-03-05",
        folderId: "youth-camp",
        size: "1.8 MB",
        type: "JPG"
    },
    {
        id: "4",
        url: "https://images.unsplash.com/photo-1629822908853-b1d2a39ece98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwcGFpbnRpbmclMjBhcnQlMjBjbGFzc3xlbnwxfHx8fDE3Njk1MDIxNTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Sunday School.png",
        date: "2024-03-01",
        lastModified: "2024-03-02",
        folderId: "sunday-service",
        size: "4.2 MB",
        type: "PNG"
    },
    {
        id: "5",
        url: "https://images.unsplash.com/photo-1663230910582-21f3ae6ee7d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjBiYXB0aXNtJTIwd2F0ZXJ8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Baptism.jpg",
        date: "2024-02-28",
        lastModified: "2024-02-28",
        folderId: "sunday-service",
        size: "5.5 MB",
        type: "JPG"
    },
    {
        id: "v1",
        url: "https://images.unsplash.com/photo-1667900141150-21a07051cf42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2glMjBzZXJ2aWNlJTIwZmxvd2VycyUyMGJyaWdodHxlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Easter Service 2024",
        originalTitle: "Full Easter Service 4K Main Hall",
        date: "2024-03-31",
        lastModified: "2024-04-01",
        folderId: "worship",
        type: "YOUTUBE",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        tags: ["worship", "easter", "main-hall"]
    },
    {
        id: "v2",
        url: "https://images.unsplash.com/photo-1642185859150-40942764765e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNhbXAlMjBvdXRkb29yJTIwcmV0cmVhdCUyMGJvbmZpcmV8ZW58MXx8fHwxNzY5NTAyMTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        name: "Youth Retreat Highlight",
        originalTitle: "Youth Retreat 2024 Recap V2 Final",
        date: "2024-04-15",
        lastModified: "2024-04-20",
        folderId: "youth-camp",
        type: "VIMEO",
        videoUrl: "https://vimeo.com/123456789",
        tags: ["youth", "retreat", "highlights"]
    }
];

export { mockMedia as mockPhotos }; // Backward compatibility
