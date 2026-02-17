
export type MinistryStatus = 'published' | 'draft' | 'archived';

export interface Meeting {
    id: string;
    label: string;
    location: string;
    day: string;
    time: string;
    type: 'in-person' | 'online' | 'hybrid';
    mapLink?: string;
    zoomLink?: string;
}

export interface SocialLink {
    platform: 'email' | 'twitter' | 'instagram' | 'facebook' | 'linkedin';
    url: string;
}

export interface Leader {
    id: string;
    name: string;
    role: string;
    imageUrl?: string;
    bio: string;
    socials: SocialLink[];
    isContactPerson: boolean;
}

export interface Testimonial {
    id: string;
    author: string;
    role?: string;
    content: string;
    imageUrl?: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export interface WebsiteOverrides {
    heroSectionTitle?: string;
    aboutSectionTitle?: string;
    teamSectionTitle?: string;
    eventsSectionTitle?: string;
    storiesSectionTitle?: string;
    gallerySectionTitle?: string;
    faqSectionTitle?: string;
    joinSectionTitle?: string;
}

export interface TemplateConfig {
    layoutVariant: 'standard' | 'hero-focused' | 'minimal';
    colorTheme: 'default' | 'ocean' | 'sunset' | 'forest';
    showMeetingInfo: boolean;
    showLeaders: boolean;
    showTestimonials: boolean;
    showFAQ: boolean;
}

export interface Ministry {
    id: string;
    name: string;
    description: string;
    status: MinistryStatus;
    bannerImage?: string;
    
    // Design fidelity fields
    heroSubtitle?: string;
    heroDescription?: string;
    
    meetings: Meeting[];
    leaders: Leader[];
    testimonials: Testimonial[];
    faqs: FAQ[];
    
    // Website specific overrides (not core CMS data)
    websiteOverrides: WebsiteOverrides;
    
    templateConfig: TemplateConfig;
    
    // For list view stats
    memberCount: number;
    lastUpdated: string;
}

// Helper to create consistent mock data
const createMockMinistry = (id: string, name: string, description: string, memberCount: number): Ministry => ({
    id,
    name,
    description,
    status: 'published',
    bannerImage: `https://source.unsplash.com/random/1200x400/?campus,university,${name.toLowerCase().replace(/\s/g, ',')}`,
    heroSubtitle: `${name} Club`,
    heroDescription: 'A community of faith, hope, and love.',
    meetings: [
        {
            id: `m-${id}`,
            label: 'Weekly Fellowship',
            location: 'Student Union Building',
            day: 'Thursday',
            time: '07:30 PM',
            type: 'in-person'
        }
    ],
    leaders: [],
    testimonials: [],
    faqs: [],
    websiteOverrides: {},
    templateConfig: {
        layoutVariant: 'standard',
        colorTheme: 'default',
        showMeetingInfo: true,
        showLeaders: true,
        showTestimonials: true,
        showFAQ: true
    },
    memberCount,
    lastUpdated: new Date().toISOString().split('T')[0]
});

export const mockMinistries: Ministry[] = [
    {
        id: 'lbcc',
        name: 'LBCC',
        description: '"I am the true vine, and my Father is the gardener." (John 15:1)\n\nWe are a community of students who want to know God and make Him known. We have Bible studies, fellowship, and fun events throughout the semester.\n\nYou can join us any time!',
        status: 'published',
        bannerImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80',
        heroSubtitle: 'True Vine Club',
        heroDescription: 'Jesus is the true vine and we are his branches.',
        meetings: [
            { id: 'm1', label: 'Bible Study', location: 'Building T, Room 1200', day: 'Wednesday', time: '12:00 PM', type: 'in-person' }
        ],
        leaders: [
            { id: 'l1', name: 'Jordan Lee', role: 'Campus Minister', bio: 'Serving LBCC students for 5 years. I love playing basketball and drinking coffee.', isContactPerson: true, socials: [] }
        ],
        testimonials: [
            {
                id: 't1',
                author: 'Michael Brown',
                role: 'Freshman',
                content: 'I never knew the Bible could be so interesting until I joined True Vine.',
                imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80'
            }
        ],
        faqs: [
             { id: 'f1', question: 'Do I need to be a Christian to join?', answer: 'No! Everyone is welcome to join our meetings and events regardless of their background.' },
             { id: 'f2', question: 'What is a typical meeting like?', answer: 'We usually start with some songs, hear a short message from the Bible, and then break into small groups for discussion.' },
             { id: 'f3', question: 'Is there a cost to join?', answer: 'No, all our activities are free.' }
        ],
        websiteOverrides: {
            storiesSectionTitle: 'Student Stories'
        },
        templateConfig: { layoutVariant: 'standard', colorTheme: 'ocean', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 45,
        lastUpdated: '2024-01-15'
    },
    {
        id: 'usc',
        name: 'USC',
        description: '"Be strong and courageous. Do not be afraid; do not be discouraged." (Joshua 1:9)\n\nFighting on for the faith at USC. Seeking to know Christ and make Him known through Bible study and fellowship.\n\nJoin us at the TCC!',
        status: 'published',
        bannerImage: 'https://images.unsplash.com/photo-1583336146604-5858032e185d?auto=format&fit=crop&q=80',
        heroSubtitle: 'Trojan Fellowship',
        heroDescription: 'Fight On! Fight for Faith!',
        meetings: [
            { id: 'm1', label: 'Trojan Christian Fellowship', location: 'TCC 227', day: 'Thursday', time: '7:30 PM', type: 'in-person' }
        ],
        leaders: [
            { id: 'l1', name: 'Emily Zhang', role: 'President', bio: 'Junior studying Business. Love USC!', isContactPerson: true, socials: [] },
            { id: 'l2', name: 'David Kim', role: 'Worship Leader', bio: 'Singing for the Lord.', isContactPerson: false, socials: [] }
        ],
        testimonials: [
            {
                id: 't1',
                author: 'Jessica Lee',
                role: 'Sophomore',
                content: 'Finding this community was the best part of my freshman year. I found true friends here.',
                imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80'
            }
        ],
        faqs: [
            { id: 'f1', question: 'Where do you meet?', answer: 'We meet in the Trojan Campus Center (TCC) room 227 every Thursday.' }
        ],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'default', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 75,
        lastUpdated: '2024-01-19'
    },
    {
        id: 'csulb',
        name: 'CSULB',
        description: '"Follow me, and I will make you fishers of men." (Matthew 4:19)\n\nBuilding a family of believers at The Beach. We are committed to sharing the gospel and making disciples.\n\nCome check us out at the USU!',
        status: 'published',
        heroSubtitle: 'Beach Christian Fellowship',
        heroDescription: 'Go Beach! Go with God!',
        meetings: [
            { id: 'm1', label: 'Large Group', location: 'University Student Union', day: 'Thursday', time: '7:00 PM', type: 'in-person' }
        ],
        leaders: [
            { id: 'l1', name: 'Sarah Chen', role: 'Staff', bio: 'Go Beach!', isContactPerson: true, socials: [] }
        ],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'hero-focused', colorTheme: 'default', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 120,
        lastUpdated: '2024-01-20'
    },
    {
        id: 'csuf',
        name: 'CSUF',
        description: 'Walking with Jesus at CSUF. A community dedicated to loving God and loving our campus.',
        status: 'published',
        heroSubtitle: 'Titan Fellowship',
        heroDescription: 'Reaching Titans for Christ.',
        meetings: [
            { id: 'm1', label: 'Weekly Gathering', location: 'Titan Student Union', day: 'Wednesday', time: '6:30 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'sunset', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 85,
        lastUpdated: '2024-01-18'
    },
    {
        id: 'ucla',
        name: 'UCLA',
        description: 'Serving the Bruins with the gospel of grace. Come find community and purpose.',
        status: 'published',
        heroSubtitle: 'Bruin Christian Fellowship',
        meetings: [
            { id: 'm1', label: 'Bruin Fellowship', location: 'Ackerman Union', day: 'Tuesday', time: '8:00 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'ocean', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 90,
        lastUpdated: '2024-01-22'
    },
    {
        id: 'csudh',
        name: 'CSUDH',
        description: 'Growing in faith at CSUDH. A welcoming community for all Toros.',
        status: 'published',
        meetings: [
            { id: 'm1', label: 'Bible Study', location: 'LSU', day: 'Wednesday', time: '1:00 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'default', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 30,
        lastUpdated: '2024-01-10'
    },
    {
        id: 'ccc',
        name: 'CCC',
        description: 'Community and Christ at CCC. Connect with other students and explore faith together.',
        status: 'published',
        meetings: [
            { id: 'm1', label: 'Campus Connect', location: 'Student Center', day: 'Tuesday', time: '12:00 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'default', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 25,
        lastUpdated: '2024-01-12'
    },
    {
        id: 'mtsac',
        name: 'Mt. Sac',
        description: 'Climbing higher in faith at Mt. Sac. Join us for fellowship and Bible study.',
        status: 'published',
        meetings: [
            { id: 'm1', label: 'Mountaineer Fellowship', location: 'Building 9C', day: 'Thursday', time: '5:00 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'forest', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 55,
        lastUpdated: '2024-01-14'
    },
    {
        id: 'goldenstate',
        name: 'Golden State',
        description: 'Shining the light of Christ. A community of believers growing together.',
        status: 'published',
        meetings: [],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'sunset', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 20,
        lastUpdated: '2024-01-05'
    },
    {
        id: 'cypress',
        name: 'Cypress',
        description: 'Growing together in Christ at Cypress. We welcome everyone to join our family.',
        status: 'published',
        meetings: [
            { id: 'm1', label: 'Charger Christian Club', location: 'CCCPLX-414', day: 'Wednesday', time: '12:30 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'ocean', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 40,
        lastUpdated: '2024-01-16'
    },
    {
        id: 'cpp',
        name: 'Cal Poly Pomona',
        description: 'Learn by doing, grow by believing. Experience God\'s love on campus.',
        status: 'published',
        meetings: [
            { id: 'm1', label: 'Bronco Fellowship', location: 'BSC Orion', day: 'Friday', time: '6:00 PM', type: 'in-person' }
        ],
        leaders: [],
        testimonials: [],
        faqs: [],
        websiteOverrides: {},
        templateConfig: { layoutVariant: 'standard', colorTheme: 'forest', showMeetingInfo: true, showLeaders: true, showTestimonials: true, showFAQ: true },
        memberCount: 65,
        lastUpdated: '2024-01-21'
    }
];
