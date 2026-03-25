/**
 * Reset website structure to seed state.
 *
 * WARNING: This script DELETES and RECREATES all website-managed DB records:
 *   - Theme + ThemeCustomization
 *   - SiteSettings
 *   - Menus + MenuItems (HEADER, FOOTER)
 *   - Pages + PageSections
 *
 * Any manual edits made via the CMS builder will be LOST.
 * Content tables (messages, events, people, etc.) are NOT touched.
 *
 * It is IDEMPOTENT — safe to run multiple times. It deletes existing
 * website records for the church and recreates them from scratch.
 *
 * Usage: npx tsx scripts/deploy-data/reset-website-seed.mts
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ============================================================
// CDN base URL for initial website assets (R2 media bucket)
// ============================================================
const CDN = 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/initial-setup'

// ============================================================
// Resolve church ID
// ============================================================
const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) {
  console.error(`Church not found: ${slug}`)
  process.exit(1)
}
const churchId = church.id
console.log(`Church: ${church.name} (${churchId})\n`)

// ============================================================
// 1. CLEAN existing website data (order matters for FK constraints)
// ============================================================
console.log('Cleaning existing website data...')

// Delete page sections first, then pages
const deletedSections = await prisma.pageSection.deleteMany({ where: { churchId } })
console.log(`  Deleted ${deletedSections.count} page sections`)

const deletedPages = await prisma.page.deleteMany({ where: { churchId } })
console.log(`  Deleted ${deletedPages.count} pages`)

// Delete menu items first, then menus
const menus = await prisma.menu.findMany({ where: { churchId }, select: { id: true } })
if (menus.length > 0) {
  const menuIds = menus.map((m) => m.id)
  const deletedItems = await prisma.menuItem.deleteMany({ where: { menuId: { in: menuIds } } })
  console.log(`  Deleted ${deletedItems.count} menu items`)
}
const deletedMenus = await prisma.menu.deleteMany({ where: { churchId } })
console.log(`  Deleted ${deletedMenus.count} menus`)

// Delete theme customization, then theme
const deletedCustom = await prisma.themeCustomization.deleteMany({ where: { churchId } })
console.log(`  Deleted ${deletedCustom.count} theme customizations`)

// Site settings
const deletedSettings = await prisma.siteSettings.deleteMany({ where: { churchId } })
console.log(`  Deleted ${deletedSettings.count} site settings`)

console.log('')

// ============================================================
// 2. THEME
// ============================================================
console.log('Creating theme...')
// Upsert the global theme (not church-scoped)
let theme = await prisma.theme.findFirst({ where: { slug: 'modern-church' } })
if (!theme) {
  theme = await prisma.theme.create({
    data: {
      name: 'Modern Church',
      slug: 'modern-church',
      isDefault: true,
      isActive: true,
      defaultTokens: {
        primaryColor: '#1a1a2e',
        secondaryColor: '#e94560',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        headingColor: '#1a1a2e',
        headingFont: 'DM Serif Display',
        bodyFont: 'Helvetica Neue',
        baseFontSize: 16,
        borderRadius: '0.5rem',
      },
    },
  })
  console.log(`  Created theme: ${theme.name}`)
} else {
  console.log(`  Theme already exists: ${theme.name}`)
}

// ============================================================
// 3. THEME CUSTOMIZATION
// ============================================================
console.log('Creating theme customization...')
await prisma.themeCustomization.create({
  data: {
    churchId,
    themeId: theme.id,
    primaryColor: '#0D0D0D',
    secondaryColor: '#3667B1',
    backgroundColor: '#FAFAFA',
    textColor: '#0D0D0D',
    headingColor: '#0D0D0D',
    baseFontSize: 16,
    borderRadius: '0.5rem',
    tokenOverrides: {
      // LA UBF brand colors
      brandPrimary: '#3667B1',
      brandSecondary: '#061B4F',
      accentGreen: '#009966',
      accentBlue: '#155DFC',
      accentOrange: '#FF6900',
      // Surface colors
      surfacePage: '#FAFAFA',
      surfaceDark: '#0D0D0D',
      // Neutrals
      black1: '#0D0D0D',
      black2: '#313131',
      black3: '#676767',
      white0: '#FFFFFF',
      white1: '#FAFAFA',
      white2: '#E8E8E8',
      // Fonts
      fontSans: '"Helvetica Neue", "Helvetica", "Arial", ui-sans-serif, system-ui, sans-serif',
      fontSerif: '"DM Serif Display", ui-serif, Georgia, serif',
      fontDisplay: '"DM Serif Display", ui-serif, Georgia, serif',
      fontScript: '"strude", cursive',
      // Custom fonts
      customFonts: [
        { family: 'Helvetica Neue', url: 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/fonts/helvetica-neue/HelveticaNeueRoman.otf', weight: '400', format: 'opentype' },
        { family: 'Helvetica Neue', url: 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/fonts/helvetica-neue/HelveticaNeueMedium.otf', weight: '500', format: 'opentype' },
        { family: 'Helvetica Neue', url: 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/fonts/helvetica-neue/HelveticaNeueBold.otf', weight: '700', format: 'opentype' },
        { family: 'strude', url: 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/fonts/strude/strude.ttf', weight: '400', format: 'truetype' },
      ],
      // Google fonts
      googleFonts: [
        { family: 'DM Serif Display', weight: '400', style: 'italic' },
      ],
    },
  },
})
console.log('  Created theme customization')

// ============================================================
// 4. SITE SETTINGS
// ============================================================
console.log('Creating site settings...')
await prisma.siteSettings.create({
  data: {
    churchId,
    siteName: 'LA UBF',
    tagline: 'Los Angeles University Bible Fellowship',
    description:
      'LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.',
    logoUrl: `${CDN}/laubf-logo.svg`,
    logoDarkUrl: `${CDN}/laubf-logo-blue.svg`,
    logoAlt: 'LA UBF',
    faviconUrl: '/favicon.ico',
    contactEmail: 'laubf.downey@gmail.com',
    contactPhone: '(562) 396-6350',
    contactAddress: '11625 Paramount Blvd, Downey, CA 90241',
    instagramUrl: 'https://instagram.com/la.ubf',
    facebookUrl: 'https://facebook.com/losangelesubf',
    youtubeUrl: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA',
    tiktokUrl: 'https://www.tiktok.com/@la.ubf',
    serviceTimes: [
      { day: 'Sunday', time: '11:00 AM – 12:30 PM', label: 'Sunday Worship Service' },
      { day: 'Monday-Friday', time: '6:00 AM', label: 'Daily Bread & Prayer Meeting' },
      { day: 'Daily', time: '7:30 PM', label: 'Evening Prayer Meeting' },
      { day: 'Saturday', time: '8:00 AM', label: "Men's Bible Study" },
    ],
    enableSearch: true,
    enableGiving: false,
    enableBlog: false,
    navCtaLabel: "I'm New",
    navCtaHref: '/im-new',
    navCtaVisible: true,
    ogImageUrl: `${CDN}/compressed-congregation.jpg`,
  },
})
console.log('  Created site settings')

// ============================================================
// 5. MENUS
// ============================================================
console.log('Creating menus...')

// --- HEADER menu ---
const headerMenu = await prisma.menu.create({
  data: { churchId, name: 'Main Navigation', slug: 'main-navigation', location: 'HEADER' },
})

// Our Church dropdown
const ourChurchItem = await prisma.menuItem.create({
  data: { menuId: headerMenu.id, label: 'Our Church', sortOrder: 0, groupLabel: 'About' },
})
const ourChurchChildren = [
  { label: 'Who We Are', description: 'Our mission & vision', href: '/about', iconName: 'info', groupLabel: 'About', sortOrder: 0 },
  { label: "I'm New", description: 'Plan your visit', href: '/im-new', iconName: 'map-pin', groupLabel: 'About', sortOrder: 1 },
  { label: 'Events', href: '/events?tab=event', iconName: 'calendar', groupLabel: 'Connect', sortOrder: 2 },
  { label: 'Meetings', href: '/events?tab=meeting', iconName: 'users', groupLabel: 'Connect', sortOrder: 3 },
  { label: 'Programs', href: '/events?tab=program', iconName: 'book-open', groupLabel: 'Connect', sortOrder: 4 },
  { label: 'Daily Bread & Prayer', description: 'Mon-Fri @ 6 AM', href: 'https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09', iconName: 'book-open', isExternal: true, openInNewTab: true, groupLabel: 'Quick Links', sortOrder: 5 },
  { label: 'Evening Prayer', description: 'Every Day @ 7:30 PM', href: 'https://meet.google.com/pgm-trah-moc', iconName: 'hand-heart', isExternal: true, openInNewTab: true, groupLabel: 'Quick Links', sortOrder: 6 },
  { label: "Men's Bible Study", description: 'Sat @ 8 AM', href: 'https://zoom.us', iconName: 'users', isExternal: true, openInNewTab: true, groupLabel: 'Quick Links', sortOrder: 7 },
  { label: 'Sunday Livestream', description: 'Sun @ 11 AM', href: 'https://www.youtube.com/@LAUBF/streams', iconName: 'radio', isExternal: true, openInNewTab: true, groupLabel: 'Quick Links', sortOrder: 8 },
]
for (const child of ourChurchChildren) {
  await prisma.menuItem.create({
    data: { menuId: headerMenu.id, parentId: ourChurchItem.id, ...child },
  })
}

// Ministries dropdown
const ministriesItem = await prisma.menuItem.create({
  data: { menuId: headerMenu.id, label: 'Ministries', href: '/ministries', sortOrder: 1 },
})
const ministryGroups = [
  { label: 'College & Young Adults', href: '/ministries/college', iconName: 'graduation-cap', groupLabel: 'Ministry Groups', sortOrder: 0 },
  { label: 'Adults', href: '/ministries/adults', iconName: 'users', groupLabel: 'Ministry Groups', sortOrder: 1 },
  { label: 'Middle & High School (JBF & HBF)', href: '/ministries/high-school', iconName: 'landmark', groupLabel: 'Ministry Groups', sortOrder: 2 },
  { label: 'Children (BBF & CBF)', href: '/ministries/children', iconName: 'baby', groupLabel: 'Ministry Groups', sortOrder: 3 },
]
for (const mg of ministryGroups) {
  await prisma.menuItem.create({
    data: { menuId: headerMenu.id, parentId: ministriesItem.id, ...mg },
  })
}

// Campus ministries under Ministries dropdown
const campusSlugs = [
  { label: 'LBCC', desc: 'Long Beach City College', slug: 'lbcc' },
  { label: 'CSULB', desc: 'Cal State Long Beach', slug: 'csulb' },
  { label: 'CSUF', desc: 'Cal State Fullerton', slug: 'csuf' },
  { label: 'UCLA', desc: 'University of California, Los Angeles', slug: 'ucla' },
  { label: 'USC', desc: 'University of Southern California', slug: 'usc' },
  { label: 'CSUDH', desc: 'Cal State Dominguez Hills', slug: 'csudh' },
  { label: 'CCC', desc: 'Cerritos Community College', slug: 'ccc' },
  { label: 'MT. SAC', desc: 'Mt. San Antonio College', slug: 'mt-sac' },
  { label: 'Golden West', desc: 'Golden West College', slug: 'golden-west' },
  { label: 'Cypress College', slug: 'cypress' },
  { label: 'Cal Poly Pomona', slug: 'cal-poly-pomona' },
]
for (let i = 0; i < campusSlugs.length; i++) {
  const c = campusSlugs[i]
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ministriesItem.id,
      label: c.label,
      description: c.desc || undefined,
      href: `/ministries/campus/${c.slug}`,
      iconName: 'map-pin',
      groupLabel: 'Campus Ministries',
      sortOrder: 10 + i,
    },
  })
}
// Ministry overview featured link
await prisma.menuItem.create({
  data: {
    menuId: headerMenu.id,
    parentId: ministriesItem.id,
    label: 'Ministry Overview',
    description: 'Learn about the ministries that shape our community',
    href: '/ministries',
    featuredTitle: 'Ministry Overview',
    featuredDescription: 'Learn about the ministries that shape our community',
    featuredHref: '/ministries',
    sortOrder: 99,
  },
})

// Resources dropdown
const resourcesItem = await prisma.menuItem.create({
  data: { menuId: headerMenu.id, label: 'Resources', sortOrder: 2 },
})
const resourceChildren = [
  { label: 'Messages', href: '/messages', iconName: 'video', groupLabel: 'The Word', sortOrder: 0 },
  { label: 'Bible Studies', href: '/bible-study', iconName: 'book-open', groupLabel: 'The Word', sortOrder: 1 },
  { label: 'Daily Bread', href: '/daily-bread', iconName: 'book-text', groupLabel: 'The Word', sortOrder: 2 },
  { label: 'Videos', href: '/videos', iconName: 'monitor-play', groupLabel: 'Media', sortOrder: 3 },
]
for (const rc of resourceChildren) {
  await prisma.menuItem.create({
    data: { menuId: headerMenu.id, parentId: resourcesItem.id, ...rc },
  })
}

// Top-level: Giving
await prisma.menuItem.create({
  data: { menuId: headerMenu.id, label: 'Giving', href: '/giving', sortOrder: 3 },
})

// --- FOOTER menu ---
const footerMenu = await prisma.menu.create({
  data: { churchId, name: 'Footer Navigation', slug: 'footer-navigation', location: 'FOOTER' },
})

const exploreLinks = [
  { label: 'About Us', href: '/about' },
  { label: "I'm New", href: '/im-new' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Events', href: '/events' },
  { label: 'Messages', href: '/messages' },
  { label: 'Giving', href: '/giving' },
]
for (let i = 0; i < exploreLinks.length; i++) {
  await prisma.menuItem.create({
    data: { menuId: footerMenu.id, label: exploreLinks[i].label, href: exploreLinks[i].href, groupLabel: 'EXPLORE', sortOrder: i },
  })
}

const resourceLinks = [
  { label: 'UBF HQ', href: 'https://ubf.org/' },
  { label: 'Chicago UBF', href: 'https://www.chicagoubf.org/' },
  { label: 'Korea UBF', href: 'https://www.ubf.kr/' },
  { label: 'UBF HQ YouTube', href: 'https://www.youtube.com/user/ubfwebdev' },
  { label: 'LA UBF YouTube', href: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA' },
  { label: 'Daily Bread YouTube', href: 'https://www.youtube.com/c/ubfdailybread' },
]
for (let i = 0; i < resourceLinks.length; i++) {
  await prisma.menuItem.create({
    data: { menuId: footerMenu.id, label: resourceLinks[i].label, href: resourceLinks[i].href, isExternal: true, openInNewTab: true, groupLabel: 'RESOURCES', sortOrder: 10 + i },
  })
}

console.log('  Created header + footer menus with items')

// ============================================================
// 6. PAGES + PAGE SECTIONS
// ============================================================
console.log('Creating pages and sections...')

type SectionInput = {
  sectionType: string
  label?: string
  colorScheme?: string
  paddingY?: string
  containerWidth?: string
  visible?: boolean
  content: Record<string, unknown>
}

async function createPageWithSections(
  pageData: {
    slug: string
    title: string
    isHomepage?: boolean
    pageType?: string
    layout?: string
    parentId?: string
    metaDescription?: string
    sortOrder?: number
  },
  sections: SectionInput[],
) {
  const page = await prisma.page.create({
    data: {
      churchId,
      slug: pageData.slug,
      title: pageData.title,
      isHomepage: pageData.isHomepage || false,
      isPublished: true,
      publishedAt: new Date(),
      pageType: (pageData.pageType || 'STANDARD') as any,
      layout: (pageData.layout || 'FULL_WIDTH') as any,
      parentId: pageData.parentId || null,
      metaDescription: pageData.metaDescription || null,
      sortOrder: pageData.sortOrder || 0,
    },
  })
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]
    await prisma.pageSection.create({
      data: {
        churchId,
        pageId: page.id,
        sectionType: s.sectionType as any,
        label: s.label || null,
        sortOrder: i,
        colorScheme: (s.colorScheme || 'LIGHT') as any,
        paddingY: (s.paddingY || 'DEFAULT') as any,
        containerWidth: (s.containerWidth || 'STANDARD') as any,
        visible: s.visible ?? true,
        content: s.content,
      },
    })
  }
  return page
}

// ── Shared content blocks ──────────────────────────────────

const sharedCampusGrid = {
  decorativeImages: [
    { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-1.jpg`, alt: 'Campus group photo' },
    { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-2.jpg`, alt: 'Bible study outdoors' },
    { src: `${CDN}/compressed-3.png`, alt: 'Fellowship event' },
  ],
  heading: 'Join a Campus Ministry',
  description: 'We have Bible study groups meeting on campuses across Southern California. Find a group near you and start studying the Bible with fellow students.',
  campuses: [
    { id: 'lbcc', abbreviation: 'LBCC', fullName: 'Long Beach City College', href: '/ministries/campus/lbcc' },
    { id: 'csulb', abbreviation: 'CSULB', fullName: 'Cal State Long Beach', href: '/ministries/campus/csulb' },
    { id: 'csuf', abbreviation: 'CSUF', fullName: 'Cal State Fullerton', href: '/ministries/campus/csuf' },
    { id: 'ucla', abbreviation: 'UCLA', fullName: 'University of California, Los Angeles', href: '/ministries/campus/ucla' },
    { id: 'usc', abbreviation: 'USC', fullName: 'University of Southern California', href: '/ministries/campus/usc' },
    { id: 'csudh', abbreviation: 'CSUDH', fullName: 'Cal State Dominguez Hills', href: '/ministries/campus/csudh' },
    { id: 'ccc', abbreviation: 'CCC', fullName: 'Cerritos Community College', href: '/ministries/campus/ccc' },
    { id: 'mt-sac', abbreviation: 'MT. SAC', fullName: 'Mt. San Antonio College', href: '/ministries/campus/mt-sac' },
    { id: 'golden-west', abbreviation: 'GWC', fullName: 'Golden West College', href: '/ministries/campus/golden-west' },
    { id: 'cypress', abbreviation: '', fullName: 'Cypress College', href: '/ministries/campus/cypress' },
    { id: 'cal-poly-pomona', abbreviation: '', fullName: 'Cal Poly Pomona', href: '/ministries/campus/cal-poly-pomona' },
  ],
  ctaHeading: "Don\u2019t see your campus?",
  ctaButton: { label: 'Contact Us', href: '/im-new#plan-visit' },
  showCtaIcon: false,
}

const sharedNewcomer = {
  heading: 'Are you a newcomer?',
  description: 'We know that visiting a new church can be intimidating. Learn more about our church and how you can take your next steps at LA UBF.',
  buttonLabel: "I\u2019m new",
  buttonHref: '/im-new',
  image: { src: `${CDN}/images-home-compressed-sunday-worship.jpg`, alt: 'Sunday worship at LA UBF' },
}

const sharedFormContent = {
  overline: 'Plan Your Visit',
  heading: 'Let us help you start',
  description: "Let us know you\u2019re coming and we\u2019ll save a seat for you! We can also help match you with a Bible teacher or answer any questions about our ministries.",
  interestOptions: [
    { label: 'Sunday Service', value: 'sunday-service' },
    { label: 'College Campus Group', value: 'college-group' },
    { label: 'Personal Bible Study', value: 'personal-bible-study' },
    { label: 'Group Bible Study', value: 'group-bible-study' },
    { label: 'Giving', value: 'giving' },
    { label: 'Other', value: 'other' },
  ],
  campusOptions: [
    { label: 'LBCC', value: 'lbcc' },
    { label: 'CSULB', value: 'csulb' },
    { label: 'CSUF', value: 'csuf' },
    { label: 'UCLA', value: 'ucla' },
    { label: 'USC', value: 'usc' },
    { label: 'CSUDH', value: 'csudh' },
    { label: 'Cerritos Community College', value: 'ccc' },
    { label: 'Mt. San Antonio College', value: 'mt-sac' },
    { label: 'Golden West College', value: 'golden-west' },
    { label: 'Cypress College', value: 'cypress' },
    { label: 'Cal Poly Pomona', value: 'cal-poly-pomona' },
  ],
  bibleTeacherLabel: "I\u2019d like to be matched with a personal bible teacher for bible studies or spiritual guidance",
  submitLabel: 'Submit',
  successMessage: "Thank you! We\u2019ve received your message and will get back to you soon.",
}

const sharedCampusFaq = (campusName: string, ctaHref?: string) => ({
  heading: 'Frequently Asked Questions',
  showIcon: true,
  items: [
    { question: 'How do I sign up?', answer: `You can reach out to us through the contact links at the top of this page, or sign up directly through the Start Bible Study link.`, answerHtml: `You can reach out to us through the contact links at the top of this page, or sign up directly through the <a href="${ctaHref || '#'}" target="_blank" rel="noopener noreferrer">Start Bible Study</a> link.` },
    { question: 'Do I need to bring anything?', answer: "Just bring yourself! We provide study materials and Bibles. Feel free to bring your own Bible if you have one." },
    { question: `Is this only for ${campusName} students?`, answer: `While our group is based at ${campusName}, anyone is welcome to join. You don\u2019t have to be a current student to attend.` },
    { question: 'What denomination is UBF?', answer: "UBF is a non-denominational evangelical Christian organization. We focus on Bible study and discipleship across all Christian traditions." },
    { question: 'How can I get involved beyond Bible study?', answer: "There are many ways to get involved! Join us for fellowship meals, outreach events, conferences, and worship services. Talk to a group leader to learn more." },
  ],
})

const sharedCampusOtherGrid = {
  decorativeImages: [
    { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-1.jpg`, alt: 'Campus group photo' },
    { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-2.jpg`, alt: 'Bible study outdoors' },
    { src: `${CDN}/compressed-3.png`, alt: 'Fellowship event' },
  ],
  heading: 'Check out other campuses',
  campuses: [
    { id: 'lbcc', abbreviation: 'LBCC', fullName: 'Long Beach City College', href: '/ministries/campus/lbcc' },
    { id: 'csulb', abbreviation: 'CSULB', fullName: 'Cal State Long Beach', href: '/ministries/campus/csulb' },
    { id: 'csuf', abbreviation: 'CSUF', fullName: 'Cal State Fullerton', href: '/ministries/campus/csuf' },
    { id: 'ucla', abbreviation: 'UCLA', fullName: 'University of California, Los Angeles', href: '/ministries/campus/ucla' },
    { id: 'usc', abbreviation: 'USC', fullName: 'University of Southern California', href: '/ministries/campus/usc' },
    { id: 'csudh', abbreviation: 'CSUDH', fullName: 'Cal State Dominguez Hills', href: '/ministries/campus/csudh' },
    { id: 'ccc', abbreviation: 'CCC', fullName: 'Cerritos Community College', href: '/ministries/campus/ccc' },
    { id: 'mt-sac', abbreviation: 'MT. SAC', fullName: 'Mt. San Antonio College', href: '/ministries/campus/mt-sac' },
    { id: 'golden-west', abbreviation: 'GWC', fullName: 'Golden West College', href: '/ministries/campus/golden-west' },
    { id: 'cypress', abbreviation: '', fullName: 'Cypress College', href: '/ministries/campus/cypress' },
    { id: 'cal-poly-pomona', abbreviation: '', fullName: 'Cal Poly Pomona', href: '/ministries/campus/cal-poly-pomona' },
  ],
}

// ── HOMEPAGE ───────────────────────────────────────────────
await createPageWithSections(
  { slug: '', title: 'Home', isHomepage: true, layout: 'FULL_WIDTH', metaDescription: 'LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.' },
  [
    { sectionType: 'HERO_BANNER', label: 'Hero', colorScheme: 'DARK', content: { heading: { line1: 'Welcome to', line2: 'LA UBF' }, subheading: "Where people find their community.\nWhere disciples are raised.\nWhere the Word of God is lived.", primaryButton: { label: "I'm new", href: '/im-new', visible: true }, secondaryButton: { label: 'Upcoming events', href: '/events', visible: true }, backgroundImage: { src: '', alt: 'LA UBF community gathering' }, backgroundVideo: { src: `${CDN}/compressed-hero-vid.mp4`, mobileSrc: `${CDN}/phone_dimension.webm` }, mediaType: 'video' } },
    { sectionType: 'MEDIA_TEXT', label: 'Who We Are', colorScheme: 'DARK', content: { overline: 'WHO WE ARE', heading: 'Christian Ministry for College Students', body: 'LA UBF (Los Angeles University Bible Fellowship) is an international, non-denominational evangelical church. We serve college students from diverse backgrounds, helping them to grow in faith, build community, and find purpose through the Word of God.', button: { label: 'More about us', href: '/about', visible: true }, images: [ { src: `${CDN}/images-home-rotatingwheel-compressed-bible-study.png`, alt: 'Bible study' }, { src: `${CDN}/images-home-rotatingwheel-compressed-campus-ministry-list.png`, alt: 'Campus ministry' }, { src: `${CDN}/images-home-rotatingwheel-compressed-campus-ministry.jpg`, alt: 'Campus ministry' }, { src: `${CDN}/images-home-rotatingwheel-compressed-event-christmas.png`, alt: 'Christmas event' }, { src: `${CDN}/images-home-rotatingwheel-compressed-fellowship.jpg`, alt: 'Fellowship' }, { src: `${CDN}/images-home-rotatingwheel-compressed-sunday-worship.jpg`, alt: 'Sunday worship' } ] } },
    { sectionType: 'HIGHLIGHT_CARDS', label: 'Featured Events', colorScheme: 'LIGHT', content: { heading: 'Featured Events', subheading: "Highlights of what's happening in our community.", ctaLabel: 'View All Events', ctaHref: '/events', dataSource: 'featured-events', includeRecurring: false } },
    { sectionType: 'EVENT_CALENDAR', label: 'Schedule', colorScheme: 'LIGHT', paddingY: 'COMPACT', content: { heading: 'Schedule', filters: ['ALL', 'Events', 'Meetings', 'Programs'], ctaButtons: [ { label: '2026 LA UBF Calendar', href: 'https://laubf.org/calendar', icon: true }, { label: 'View all events', href: '/events' } ], dataSource: 'upcoming-events' } },
    { sectionType: 'QUOTE_BANNER', label: 'Spiritual Direction', colorScheme: 'DARK', content: { overline: '2026 SPIRITUAL DIRECTION', heading: 'Not of the World', verse: { text: '16 They are not of the world, just as I am not of the world. 17 Sanctify them in the truth; your word is truth. 18 As you sent me into the world, so I have sent them into the world.', reference: 'John 17:16-18' } } },
    { sectionType: 'ACTION_CARD_GRID', label: 'Next Steps', colorScheme: 'LIGHT', content: { heading: { line1: 'Your', line2: 'Next Steps', line3: 'at LA UBF' }, subheading: 'Explore different ways to connect, grow in faith, and be part of our community.', ctaButton: { label: 'Plan your visit', href: '/im-new' }, cards: [ { id: 'ns-1', title: 'Sunday Worship', description: 'Join us every Sunday for worship, teaching, and fellowship with believers.', imageUrl: `${CDN}/images-home-compressed-sunday-worship.jpg`, imageAlt: 'Sunday worship service' }, { id: 'ns-2', title: 'College Campus Ministries', description: 'Connect with other students on your campus for Bible study and community.', imageUrl: `${CDN}/images-home-compressed-campus-ministry.jpg`, imageAlt: 'Campus ministry gathering' }, { id: 'ns-3', title: 'Personal Bible Studies', description: 'Study the Bible one-on-one with a mentor at a time that works for you.', imageUrl: `${CDN}/images-home-compressed-bible-study.png`, imageAlt: 'One-on-one Bible study' }, { id: 'ns-4', title: 'Fellowship', description: 'Build lasting friendships through shared meals, activities, and life together.', imageUrl: `${CDN}/images-home-compressed-fellowship.jpg`, imageAlt: 'Fellowship dinner' } ] } },
    { sectionType: 'DIRECTORY_LIST', label: 'Campus Ministries', colorScheme: 'LIGHT', content: { heading: 'Our Campus Ministries', items: [ { id: 'lbcc', name: 'LBCC', active: true, href: '/ministries/campus/lbcc' }, { id: 'csulb', name: 'CSULB', href: '/ministries/campus/csulb' }, { id: 'csuf', name: 'CSUF', href: '/ministries/campus/csuf' }, { id: 'ucla', name: 'UCLA', href: '/ministries/campus/ucla' }, { id: 'usc', name: 'USC', href: '/ministries/campus/usc' }, { id: 'csudh', name: 'CSUDH', href: '/ministries/campus/csudh' }, { id: 'ccc', name: 'CCC', href: '/ministries/campus/ccc' }, { id: 'mt-sac', name: 'MT. SAC', href: '/ministries/campus/mt-sac' }, { id: 'golden-west', name: 'GOLDEN WEST', href: '/ministries/campus/golden-west' }, { id: 'cypress', name: 'CYPRESS', href: '/ministries/campus/cypress' }, { id: 'cal-poly-pomona', name: 'CAL POLY POMONA', href: '/ministries/campus/cal-poly-pomona' } ], image: { src: `${CDN}/images-home-compressed-campus-ministry-list.png`, alt: 'Campus ministry students' }, ctaHeading: "Don't see your campus?", ctaButton: { label: 'Let us know your interest', href: '/im-new#plan-visit' } } },
    { sectionType: 'SPOTLIGHT_MEDIA', label: 'Latest Message', colorScheme: 'DARK', content: { sectionHeading: 'Latest Message', dataSource: 'latest-message' } },
    { sectionType: 'MEDIA_GRID', label: 'Featured Videos', colorScheme: 'DARK', content: { heading: 'Featured Videos', ctaLabel: 'View All Videos', ctaHref: '/videos', dataSource: 'latest-videos', count: 3 } },
    { sectionType: 'CTA_BANNER', label: 'Visit Us', colorScheme: 'DARK', content: { overline: 'New Here?', heading: 'Visit us this Sunday', body: 'All are welcome. Come connect with us and get to know our community.', primaryButton: { label: 'Plan your visit', href: '/im-new', visible: true }, secondaryButton: { label: 'See our ministries', href: '/ministries', visible: true }, backgroundImage: { src: `${CDN}/compressed-visit-us.jpg`, alt: 'LA UBF community' } } },
  ],
)
console.log('  Created homepage')

// ── ABOUT PAGE ─────────────────────────────────────────────
await createPageWithSections(
  { slug: 'about', title: 'About', metaDescription: 'Learn about LA UBF \u2014 our mission, values, and community of faith on college campuses across Los Angeles.', sortOrder: 1 },
  [
    { sectionType: 'TEXT_IMAGE_HERO', label: 'Who We Are Hero', colorScheme: 'LIGHT', content: { overline: 'WHO WE ARE', headingLine1: 'Christian Ministry for', headingAccent: 'College Students +', description: 'Our main focus is to study the Bible and grow in the grace and knowledge of Jesus Christ as his disciples.', image: { src: `${CDN}/images-who%20we%20are-compressed-header.jpg`, alt: 'LA UBF community gathering' } } },
    { sectionType: 'ABOUT_DESCRIPTION', label: 'About UBF', colorScheme: 'DARK', content: { logoSrc: `${CDN}/laubf-logo-blue.svg`, heading: 'About UBF', description: 'University Bible Fellowship (UBF) is an international evangelical church (non-denominational) dedicated to Christ and his kingdom. Our main focus is to study the Bible, grow in the grace and knowledge of our Lord and Savior Jesus Christ, and live according to his teachings as his disciples. We especially pray to reach college students and help them grow as his lifelong disciples. Our goal is to obey our Lord\u2019s commands to love one another and to go and make disciples of all nations (Jn 13:34; Mt 28:18-20). We pray that God may continue to call and raise lay missionaries through us and send them to the ends of the earth (Ac 1:8).', videoUrl: 'https://www.youtube.com/embed/WqeW4HtM06M', videoTitle: 'Describe UBF in 3 Words' } },
    { sectionType: 'PILLARS', label: 'The 3 Pillars', colorScheme: 'DARK', content: { overline: 'WHAT WE DO', heading: 'The 3 Pillars of LA UBF', items: [ { title: 'Bible Study', description: 'We help students study the Bible so they may come to know God personally, understand themselves, and find purpose in Jesus Christ. Bible studies are offered one-to-one with a mentor or in small groups centered around campuses and shared interests.', images: [{ src: `${CDN}/compressed-bible%20study.jpg`, alt: 'Bible study session' }] }, { title: 'Discipleship', description: 'We walk with students as they grow as disciples of Jesus through shared life and discipleship training. Our goal is to equip students to mature in faith and become disciple makers who help others follow Christ.', images: [{ src: `${CDN}/compressed-discipleship.jpg`, alt: 'Discipleship gathering' }] }, { title: 'Fellowship', description: 'Fellowship is an essential part of our faith as we support and encourage one another in community. We share fellowship through Sunday worship, activities, and retreats as we grow together in Christ.', images: [{ src: `${CDN}/images-who%20we%20are-compressed-fellowship.jpg`, alt: 'Fellowship meal' }] } ] } },
    { sectionType: 'STATEMENT', label: 'Statement of Faith', colorScheme: 'LIGHT', content: { overline: 'STATEMENT OF FAITH', heading: 'What We Believe', showIcon: true, leadIn: 'We believe that', paragraphs: [ { text: 'there is one God in three Persons: God the Father, God the Son, and God the Holy Spirit.', isBold: true }, { text: 'God created the heavens and the earth and all other things in the universe; that He is the Sovereign Ruler of all things; that the Sovereign God reveals Himself; we believe in his redemptive work and in his final judgment.', isBold: false }, { text: 'the Bible is inspired by God; that it is the truth; that it is the final authority in faith and practice.', isBold: false }, { text: 'since the fall of Adam, all people have been under the bondage and power of sin and are deserving of the judgment and wrath of God.', isBold: false }, { text: 'Jesus Christ, who is God and man, through his atoning, sacrificial death on the cross for our sins and his resurrection, is the only way of salvation; he alone saves us from sin and judgment and purifies us from the contamination of the world caused by sin', isBold: false } ] } },
    { sectionType: 'NEWCOMER', label: 'Newcomer CTA', colorScheme: 'DARK', content: sharedNewcomer },
  ],
)
console.log('  Created about page')

// ── MESSAGES PAGE ──────────────────────────────────────────
await createPageWithSections(
  { slug: 'messages', title: 'Messages', metaDescription: 'Watch and listen to Sunday messages, Bible teachings, and sermon series from LA UBF.', sortOrder: 2 },
  [
    { sectionType: 'SPOTLIGHT_MEDIA', label: 'Latest Message', colorScheme: 'DARK', paddingY: 'COMPACT', content: { sectionHeading: 'Latest Message', dataSource: 'latest-message' } },
    { sectionType: 'ALL_MESSAGES', label: 'All Messages', colorScheme: 'LIGHT', paddingY: 'NONE', content: { heading: 'All Messages', dataSource: 'all-messages' } },
  ],
)
console.log('  Created messages page')

// ── EVENTS PAGE ────────────────────────────────────────────
await createPageWithSections(
  { slug: 'events', title: 'Events', metaDescription: 'Browse upcoming events, meetings, and programs at LA UBF.', sortOrder: 3 },
  [
    { sectionType: 'EVENTS_HERO', label: 'Events Hero', colorScheme: 'DARK', paddingY: 'COMPACT', content: { heading: 'Get Involved', subtitle: 'Join us on our next gathering \u2014 whether it be bible study, conference, or fellowship.' } },
    { sectionType: 'ALL_EVENTS', label: 'All Events', colorScheme: 'LIGHT', paddingY: 'NONE', content: { heading: 'All Events', dataSource: 'all-events' } },
  ],
)
console.log('  Created events page')

// ── BIBLE STUDY PAGE ───────────────────────────────────────
await createPageWithSections(
  { slug: 'bible-study', title: 'Bible Study', metaDescription: 'Explore Bible study resources, series, and materials from LA UBF.', sortOrder: 4 },
  [
    { sectionType: 'EVENTS_HERO', label: 'Bible Study Hero', colorScheme: 'DARK', paddingY: 'COMPACT', content: { heading: 'Bible Study Resources', subtitle: 'Deep dive into the Word of God with our weekly bible study materials and questions.' } },
    { sectionType: 'ALL_BIBLE_STUDIES', label: 'All Bible Studies', colorScheme: 'LIGHT', paddingY: 'NONE', content: { heading: 'All Bible studies', dataSource: 'all-bible-studies' } },
  ],
)
console.log('  Created bible study page')

// ── VIDEOS PAGE ────────────────────────────────────────────
await createPageWithSections(
  { slug: 'videos', title: 'Videos', metaDescription: 'Watch videos from LA UBF \u2014 worship services, testimonies, and special events.', sortOrder: 5 },
  [
    { sectionType: 'EVENTS_HERO', label: 'Videos Hero', colorScheme: 'DARK', paddingY: 'COMPACT', content: { heading: 'Videos', subtitle: 'Testimonies, event recaps, worship sessions, and special features from our community.' } },
    { sectionType: 'ALL_VIDEOS', label: 'All Videos', colorScheme: 'LIGHT', paddingY: 'NONE', content: { heading: 'All Videos', dataSource: 'all-videos' } },
  ],
)
console.log('  Created videos page')

// ── DAILY BREAD PAGE ───────────────────────────────────────
await createPageWithSections(
  { slug: 'daily-bread', title: 'Daily Bread', metaDescription: "Today\u2019s Daily Bread devotional \u2014 Bible passage, reflection, and prayer from LA UBF.", sortOrder: 6 },
  [
    { sectionType: 'DAILY_BREAD_FEATURE', label: 'Daily Bread', colorScheme: 'LIGHT', paddingY: 'NONE', content: { dataSource: 'latest-daily-bread' } },
  ],
)
console.log('  Created daily bread page')

// ── MINISTRIES PAGE ────────────────────────────────────────
const ministriesPage = await createPageWithSections(
  { slug: 'ministries', title: 'Ministries', metaDescription: "Explore LA UBF ministries \u2014 campus, college, young adult, high school, and children's programs.", sortOrder: 7 },
  [
    { sectionType: 'TEXT_IMAGE_HERO', label: 'Ministries Hero', colorScheme: 'LIGHT', content: { overline: 'WHO WE ARE', headingLine1: 'Our Ministries', description: 'At LA UBF, we believe that spiritual growth happens best in community. Whether you are a student, a working professional, or a parent, there is a place for you here.', image: { src: `${CDN}/compressed-congregation.jpg`, alt: 'LA UBF community gathering' }, textAlign: 'center' } },
    { sectionType: 'PILLARS', label: 'Age Groups', colorScheme: 'DARK', content: { overline: 'MINISTRIES', heading: 'Age Groups', items: [ { title: 'Young Adults', description: 'A community of college students and young professionals growing together through campus Bible studies, fellowship, and shared worship.', images: [{ src: `${CDN}/compressed-young%20adults.jpg`, alt: 'Young adults Bible study' }], button: { label: 'Learn more', href: '/ministries/college' } }, { title: 'Adults', description: 'Adults from many walks of life\u2014campus leaders, Bible teachers, parents, and missionaries\u2014growing in faith through personal and group Bible study, conferences, and outreach.', images: [{ src: `${CDN}/compressed-adults.webp`, alt: 'Adult fellowship' }], button: { label: 'Learn more', href: '/ministries/adults' } }, { title: 'Middle & High School\n(HBF / JBF)', description: 'Our youth ministries for middle and high school students, with engaging Bible studies, fun fellowship activities, and a supportive community during these formative years.', images: [{ src: `${CDN}/compressed-middle%20n%20high.jpg`, alt: 'HBF JBF students' }], button: { label: 'Learn more', href: '/ministries/high-school' } }, { title: 'Children (CBF)', description: "A safe, engaging, and age-appropriate environment where children can learn about God\u2019s Word and build friendships while growing in faith.", images: [{ src: `${CDN}/compressed-children.webp`, alt: 'Children Bible fellowship' }], button: { label: 'Learn more', href: '/ministries/children' } } ] } },
    { sectionType: 'CAMPUS_CARD_GRID', label: 'Join a Campus Ministry', colorScheme: 'LIGHT', content: { ...sharedCampusGrid, overline: 'Are you a college student?', ctaButton: { label: 'Let us know your interest', href: '/im-new#plan-visit' }, showCtaIcon: false } },
    { sectionType: 'NEWCOMER', label: 'Newcomer CTA', colorScheme: 'DARK', content: sharedNewcomer },
  ],
)
console.log('  Created ministries page')

// ── COLLEGE / YOUNG ADULT MINISTRY ─────────────────────────
await createPageWithSections(
  { slug: 'ministries/college', title: 'College Ministry', pageType: 'MINISTRY', parentId: ministriesPage.id, metaDescription: 'LA UBF college ministry \u2014 Bible study, fellowship, and discipleship for university students.', sortOrder: 8 },
  [
    { sectionType: 'MINISTRY_HERO', label: 'College Hero', colorScheme: 'LIGHT', content: { overline: 'MINISTRY', heading: 'Young Adult / College', headingStyle: 'sans', heroImage: { src: `${CDN}/compressed-young%20adults.jpg`, alt: 'Young adult and college ministry group' } } },
    { sectionType: 'MINISTRY_INTRO', label: 'College Intro', colorScheme: 'LIGHT', content: { overline: 'INTRODUCTION', heading: 'Young Adult Ministry (YAM)', description: "The Young Adult Ministry (YAM) at LA UBF is a vibrant community of college students and young professionals growing together in faith. Through campus Bible study groups, fellowship activities, and shared worship, we create a space where young adults can explore God\u2019s Word, build meaningful friendships, and discover their calling. Whether you\u2019re on campus or in the workforce, you\u2019ll find a welcoming community here.", image: { src: `${CDN}/compressed-yam.png`, alt: 'Young adult ministry fellowship' } } },
    { sectionType: 'PILLARS', label: 'What We Do', colorScheme: 'DARK', content: { overline: '', heading: 'What We Do', items: [ { title: 'Fellowship', description: 'Our young adult fellowship is a space to build authentic friendships and grow together. From shared meals to group outings, we create opportunities for meaningful connection and community among college students and young professionals.', images: [{ src: `${CDN}/compressed-fellowship.png`, alt: 'Young adult fellowship' }] }, { title: 'Discipleship Training', description: "Through personal and group Bible study, we help young adults develop a strong foundation in God\u2019s Word. Our discipleship training equips students to grow as leaders, mentors, and faithful followers of Christ.", images: [{ src: `${CDN}/DSC05299.jpg`, alt: 'Discipleship training' }] }, { title: 'Serving Opportunities', description: "We believe in learning by serving. Young adults have the opportunity to serve through campus outreach, community events, conferences, and supporting the church\u2019s mission locally and beyond.", images: [{ src: `${CDN}/images-ministries-young%20adults-compressed-serving.jpg`, alt: 'Serving opportunities' }] } ] } },
    { sectionType: 'PHOTO_GALLERY', label: 'Photo Gallery', colorScheme: 'LIGHT', visible: true, content: { heading: 'Snippets from the Ministry', images: [ { src: `${CDN}/images-ministries-young%20adults-carousel-compressed-1.jpg`, alt: 'YAM moment 1' }, { src: `${CDN}/images-ministries-young%20adults-carousel-compressed-2.jpg`, alt: 'YAM moment 2' }, { src: `${CDN}/compressed-3.jpg`, alt: 'YAM moment 3' }, { src: `${CDN}/compressed-4.jpg`, alt: 'YAM moment 4' }, { src: `${CDN}/compressed-5.jpg`, alt: 'YAM moment 5' }, { src: `${CDN}/compressed-6.jpg`, alt: 'YAM moment 6' }, { src: `${CDN}/compressed-7.jpg`, alt: 'YAM moment 7' }, { src: `${CDN}/compressed-8.jpg`, alt: 'YAM moment 8' }, { src: `${CDN}/compressed-9.jpg`, alt: 'YAM moment 9' }, { src: `${CDN}/compressed-10.jpg`, alt: 'YAM moment 10' } ] } },
    { sectionType: 'CAMPUS_CARD_GRID', label: 'Campus Ministry', colorScheme: 'LIGHT', content: sharedCampusGrid },
    { sectionType: 'MEET_TEAM', label: 'Meet Our Team', colorScheme: 'LIGHT', content: { overline: 'YOUNG ADULT MINISTRY', heading: 'Meet Our Team', members: [ { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } } ] } },
    { sectionType: 'UPCOMING_EVENTS', label: 'Upcoming Events', colorScheme: 'DARK', content: { overline: 'YOUNG ADULT MINISTRY', heading: 'Upcoming Events', ctaButton: { label: 'View all events', href: '/events' }, dataSource: 'ministry-events', ministrySlug: 'young-adult' } },
    { sectionType: 'NEWCOMER', label: 'Newcomer CTA', colorScheme: 'DARK', content: sharedNewcomer },
  ],
)
console.log('  Created college ministry page')

// ── ADULTS MINISTRY ────────────────────────────────────────
await createPageWithSections(
  { slug: 'ministries/adults', title: 'Adults Ministry', pageType: 'MINISTRY', parentId: ministriesPage.id, metaDescription: 'LA UBF young adults ministry \u2014 community and spiritual growth for young professionals.', sortOrder: 9 },
  [
    { sectionType: 'MINISTRY_HERO', label: 'Adults Hero', colorScheme: 'LIGHT', content: { overline: 'MINISTRY', heading: 'Adult', headingStyle: 'sans', heroImage: { src: `${CDN}/compressed-adults.webp`, alt: 'Adult ministry worship service' } } },
    { sectionType: 'MINISTRY_INTRO', label: 'Adults Intro', colorScheme: 'LIGHT', content: { overline: 'INTRODUCTION', heading: 'Adult Ministry', description: "Our adult ministry brings together people from many walks of life, including campus leaders, Bible teachers, parents, missionaries, and members growing in faith. Within the adult ministry, there are opportunities for personal and group Bible study, special conferences, campus outreach, and opportunities to support the church\u2019s mission in various mission fields and beyond. Join us for Sunday worship to learn more about how you can find your place at LA UBF.", image: { src: `${CDN}/images-ministries-adults-compressed-introduction.jpg`, alt: 'Adult ministry group photo' } } },
    { sectionType: 'PILLARS', label: 'What We Do', colorScheme: 'DARK', content: { overline: '', heading: 'What We Do', items: [ { title: 'Growing in Faith', description: "Adult ministry includes opportunities for Bible study, prayer, and spiritual growth to be built up and be established in God\u2019s grace, devotionals, and shared learning, adults grow together in the Word.", images: [{ src: `${CDN}/compressed-growing.jpg`, alt: 'Growing in faith' }] }, { title: 'Raising Disciples', description: "Many adults learn to grow in leadership, mentoring, teaching personal Bible studies, or guiding others in faith. Teaching helps to grow in understanding by sharing God\u2019s Word with others. Key to our ministry is raising others as lifelong disciples of Christ.", images: [{ src: `${CDN}/compressed-disciples.jpg`, alt: 'Raising disciples' }] }, { title: 'Serving & Mission', description: "Adults take part and serve together through short-term and long-term service opportunities, seasonal conferences, campus outreach, and opportunities to support the church\u2019s mission in various mission fields and beyond.", images: [{ src: `${CDN}/images-ministries-adults-compressed-serving.jpg`, alt: 'Serving and mission' }] }, { title: 'Community & Fellowship', description: 'Adult ministry is also a place to build relationships through simple shared meals as a church, joyful worship, time spent together at various studies, and fellowship time together as a church community.', images: [{ src: `${CDN}/DSC01195.jpg`, alt: 'Community fellowship' }] } ] } },
    { sectionType: 'MEET_TEAM', label: 'Meet Our Team', colorScheme: 'LIGHT', content: { overline: 'ADULT', heading: 'Meet Our Team', members: [ { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } } ] } },
    { sectionType: 'UPCOMING_EVENTS', label: 'Upcoming Events', colorScheme: 'DARK', content: { overline: 'ADULT MINISTRY', heading: 'Upcoming Events', ctaButton: { label: 'View all events', href: '/events' }, dataSource: 'ministry-events', ministrySlug: 'adult' } },
    { sectionType: 'NEWCOMER', label: 'Newcomer CTA', colorScheme: 'DARK', content: sharedNewcomer },
  ],
)
console.log('  Created adults ministry page')

// ── HIGH SCHOOL MINISTRY ───────────────────────────────────
await createPageWithSections(
  { slug: 'ministries/high-school', title: 'High School Ministry', pageType: 'MINISTRY', parentId: ministriesPage.id, metaDescription: 'LA UBF high school ministry \u2014 faith, friendship, and Bible study for teens.', sortOrder: 10 },
  [
    { sectionType: 'MINISTRY_HERO', label: 'High School Hero', colorScheme: 'LIGHT', content: { overline: 'MINISTRY', heading: 'Middle & High School', headingStyle: 'sans', heroImage: { src: `${CDN}/images-ministries-middle%20n%20high-compressed-header.jpg`, alt: 'Middle and high school ministry group photo' } } },
    { sectionType: 'MINISTRY_INTRO', label: 'High School Intro', colorScheme: 'LIGHT', content: { overline: 'INTRODUCTION', heading: 'JBF & HBF', description: "JBF (Junior Bible Fellowship) and HBF (High School Bible Fellowship) are our youth ministries for middle school and high school students. Through engaging Bible studies, fun fellowship activities, and a supportive community, we help young people build a strong foundation of faith during these formative years.", image: { src: `${CDN}/images-ministries-middle%20n%20high-compressed-introduction.jpg`, alt: 'JBF and HBF youth ministry' } } },
    { sectionType: 'PILLARS', label: 'What We Do', colorScheme: 'DARK', content: { overline: '', heading: 'What We Do', items: [ { title: 'Praise Night', description: "Praise Night is a time for our youth to come together in worship through music, prayer, and fellowship. It\u2019s an uplifting experience where students can express their faith and grow closer to God and each other.", images: [{ src: `${CDN}/compressed-praise%20night.jpg`, alt: 'Youth praise night' }] }, { title: 'Fellowship', description: 'Fellowship activities give our youth the opportunity to build friendships, have fun, and strengthen their bonds within the church community through games, outings, and shared experiences.', images: [{ src: `${CDN}/images-ministries-middle%20n%20high-compressed-fellowship.jpg`, alt: 'Youth fellowship' }] }, { title: 'Youth Conference', description: "Our annual Youth Conference brings together students for an immersive experience of worship, Bible study, and community. It\u2019s a highlight of the year where young people are inspired and challenged in their faith.", images: [{ src: `${CDN}/compressed-jbfhbf%20conference.jpg`, alt: 'Youth conference' }] } ] } },
    { sectionType: 'PHOTO_GALLERY', label: 'Photo Gallery', colorScheme: 'LIGHT', visible: false, content: { heading: 'Snippets from the Ministry', images: [ { src: `${CDN}/images-ministries-middle%20n%20high-compressed-header.jpg`, alt: 'Youth ministry moment 1' }, { src: `${CDN}/images-ministries-middle%20n%20high-compressed-introduction.jpg`, alt: 'Youth ministry moment 2' }, { src: `${CDN}/compressed-praise%20night.jpg`, alt: 'Youth ministry moment 3' }, { src: `${CDN}/images-ministries-middle%20n%20high-compressed-fellowship.jpg`, alt: 'Youth ministry moment 4' }, { src: `${CDN}/compressed-jbfhbf%20conference.jpg`, alt: 'Youth ministry moment 5' } ] } },
    { sectionType: 'MEET_TEAM', label: 'Meet Our Team', colorScheme: 'LIGHT', content: { overline: 'JBF & HBF', heading: 'Meet Our Team', members: [ { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } } ] } },
    { sectionType: 'UPCOMING_EVENTS', label: 'Upcoming Events', colorScheme: 'DARK', content: { overline: 'YOUTH MINISTRY', heading: 'Upcoming Events', ctaButton: { label: 'View all events', href: '/events' }, dataSource: 'ministry-events', ministrySlug: 'high-school' } },
    { sectionType: 'NEWCOMER', label: 'Newcomer CTA', colorScheme: 'DARK', content: sharedNewcomer },
  ],
)
console.log('  Created high school ministry page')

// ── CHILDREN MINISTRY ──────────────────────────────────────
await createPageWithSections(
  { slug: 'ministries/children', title: "Children's Ministry", pageType: 'MINISTRY', parentId: ministriesPage.id, metaDescription: "LA UBF children's ministry \u2014 nurturing young hearts in faith and community.", sortOrder: 11 },
  [
    { sectionType: 'MINISTRY_HERO', label: 'Children Hero', colorScheme: 'LIGHT', content: { overline: 'MINISTRY', heading: 'Children', headingStyle: 'sans', heroImage: { src: `${CDN}/compressed-children.webp`, alt: 'Children ministry group photo' } } },
    { sectionType: 'MINISTRY_INTRO', label: 'Children Intro', colorScheme: 'LIGHT', content: { overline: 'INTRODUCTION', heading: 'CBF', description: "CBF (Children\u2019s Bible Fellowship) is our ministry for children, where they can learn about God\u2019s Word in a safe, engaging, and age-appropriate environment while building friendships and growing in faith.", image: { src: `${CDN}/compressed-introduction.png`, alt: 'Children bible fellowship' } } },
    { sectionType: 'MINISTRY_SCHEDULE', label: "Children's Sunday Service", colorScheme: 'DARK', content: { heading: "Children\u2019s\nSunday Service", headingStyle: 'script', timeValue: 'Every Sunday\n@ 1:30 PM (after lunch)', address: ['11625 Paramount Blvd,', 'Downey, CA 90241'], directionsUrl: 'https://maps.google.com/?q=11625+Paramount+Boulevard+Downey+CA', image: { src: `${CDN}/compressed-service.png`, alt: 'Children sunday service' } } },
    { sectionType: 'PILLARS', label: 'What We Do', colorScheme: 'DARK', content: { overline: '', heading: 'What We Do', items: [ { title: 'Singspiration', description: "Singspiration is a time for children to sing, dance, and share music\u2019s simple joy. It helps them learn about God\u2019s love through song, building worship skills early on.", images: [{ src: `${CDN}/compressed-singspiration.jpg`, alt: 'Children singspiration' }] }, { title: "Children\u2019s Bible Class", description: "In Children\u2019s Bible Class, kids learn about the Bible through lessons designed to be fun, interactive, and easy to understand for their age.", images: [{ src: `${CDN}/compressed-class.jpg`, alt: 'Children bible class' }] }, { title: 'Child Care During Sunday Service', description: 'We also offer child care during the Sunday worship service, providing a safe and engaging space for children so parents can attend the adult service with peace of mind.', images: [{ src: `${CDN}/compressed-child%20care.jpg`, alt: 'Child care during service' }] } ] } },
    { sectionType: 'MEET_TEAM', label: 'Meet Our Team', colorScheme: 'LIGHT', content: { overline: 'CBF', heading: 'Meet Our Team', members: [ { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } }, { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } } ] } },
    { sectionType: 'UPCOMING_EVENTS', label: 'Upcoming Events', colorScheme: 'DARK', content: { overline: "CHILDREN'S MINISTRY", heading: 'Upcoming Events', ctaButton: { label: 'View all events', href: '/events' }, dataSource: 'ministry-events', ministrySlug: 'children' } },
    { sectionType: 'NEWCOMER', label: 'Newcomer CTA', colorScheme: 'DARK', content: sharedNewcomer },
  ],
)
console.log('  Created children ministry page')

// ── CAMPUS DETAIL PAGES ──────────────────────────────────

// Helper for creating campus pages (shared structure)
async function createCampusPage(opts: {
  slug: string
  title: string
  metaDescription: string
  sortOrder: number
  heading: string
  ctaHref: string
  socialLinks: Array<{ platform: string; href: string }>
  heroImage: { src: string; alt: string }
  introDescription: string
  introImage?: { src: string; alt: string }
  scheduleEntries: Array<{ day: string; time: string; location: string }>
  scheduleButtons: Array<{ label: string; href: string; variant: string }>
  teamOverline: string
  teamMembers: Array<{ name: string; role: string; bio: string; image: { src: string; alt: string } }>
  campusName: string
}) {
  await createPageWithSections(
    { slug: `ministries/campus/${opts.slug}`, title: opts.title, pageType: 'CAMPUS', parentId: ministriesPage.id, metaDescription: opts.metaDescription, sortOrder: opts.sortOrder },
    [
      { sectionType: 'MINISTRY_HERO', label: `${opts.slug.toUpperCase()} Hero`, colorScheme: 'LIGHT', content: { overline: 'CAMPUS MINISTRY', heading: opts.heading, headingStyle: 'sans', ctaButton: { label: 'Start Bible Study', href: opts.ctaHref, visible: true }, socialLinks: opts.socialLinks, heroImage: opts.heroImage } },
      { sectionType: 'MINISTRY_INTRO', label: `${opts.slug.toUpperCase()} Intro`, colorScheme: 'LIGHT', content: { overline: 'INTRODUCTION', heading: 'About the Ministry', description: opts.introDescription, ...(opts.introImage ? { image: opts.introImage } : {}) } },
      { sectionType: 'MINISTRY_SCHEDULE', label: `${opts.slug.toUpperCase()} Schedule`, colorScheme: 'DARK', content: { heading: 'Join Us', description: "Whether you\u2019re a believer or just curious, you\u2019re welcome here.", scheduleLabel: 'WHEN & WHERE', scheduleEntries: opts.scheduleEntries, buttons: opts.scheduleButtons } },
      { sectionType: 'MEET_TEAM', label: `${opts.slug.toUpperCase()} Team`, colorScheme: 'LIGHT', content: { overline: opts.teamOverline, heading: 'Meet Our Team', members: opts.teamMembers } },
      { sectionType: 'FAQ_SECTION', label: `${opts.slug.toUpperCase()} FAQ`, colorScheme: 'LIGHT', containerWidth: 'NARROW', content: sharedCampusFaq(opts.campusName, opts.ctaHref) },
      { sectionType: 'CAMPUS_CARD_GRID', label: 'Other Campuses', colorScheme: 'LIGHT', content: sharedCampusOtherGrid },
    ],
  )
}

const defaultTeamMembers = [
  { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } },
  { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } },
  { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } },
]

// LBCC
await createCampusPage({
  slug: 'lbcc', title: 'LBCC Campus Ministry', metaDescription: 'LA UBF campus ministry at Long Beach City College \u2014 Bible study and fellowship for LBCC students.', sortOrder: 20,
  heading: 'LBCC\nTrue Vine Club', ctaHref: 'https://startbiblestudy.org/lbcc',
  socialLinks: [ { platform: 'Email', href: 'mailto:fishformen123@gmail.com' }, { platform: 'Instagram', href: 'https://instagram.com/lbcc.ubf' }, { platform: 'Facebook', href: 'https://www.facebook.com/lbcctruevine/' }, { platform: 'Website', href: 'https://lbcctruevine.org/' } ],
  heroImage: { src: `${CDN}/compressed-lbcc-truevineclub.jpg`, alt: 'LBCC True Vine Club campus ministry' },
  introDescription: '\u201CI am the true vine, and my Father is the gardener.\u201D (John 15:1)\n\nLBCC True Vine is our campus ministry club at LBCC. We try to help each student to study the Bible, that through Bible study he or she may come to know God personally, and also come to know himself or herself, and find the clear purpose and meaning of life in our Lord Jesus Christ. We have group Bible studies at LBCC LAC Campus.',
  scheduleEntries: [ { day: 'Tuesdays', time: '12:00 PM - 1:00 PM', location: 'College Center' }, { day: 'Thursdays', time: '5:00 PM - 6:00 PM', location: 'College Center' } ],
  scheduleButtons: [ { label: 'Start Bible Study', href: 'https://startbiblestudy.org/lbcc', variant: 'primary' }, { label: 'Visit our website', href: 'https://lbcctruevine.org/', variant: 'secondary' } ],
  teamOverline: 'LBCC TRUE VINE CLUB',
  teamMembers: [ { name: 'William Larsen', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'William Larsen' } }, { name: 'Troy Segale', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Troy Segale' } }, { name: 'Joey Fishman', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Joey Fishman' } } ],
  campusName: 'LBCC',
})
console.log('  Created LBCC campus page')

// CSULB
await createCampusPage({
  slug: 'csulb', title: 'CSULB Campus Ministry', metaDescription: 'LA UBF campus ministry at Cal State Long Beach \u2014 Bible study and fellowship for CSULB students.', sortOrder: 21,
  heading: 'CSULB\nTrue Vine Club', ctaHref: 'https://startbiblestudy.org/csulb',
  socialLinks: [ { platform: 'Instagram', href: 'https://www.instagram.com/truevine_csulb/' } ],
  heroImage: { src: `${CDN}/compressed-hero.jpg`, alt: 'CSULB True Vine Club campus ministry' },
  introDescription: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
  scheduleEntries: [ { day: 'Wednesdays', time: '7:00 PM - 8:00 PM', location: 'Student Union 2nd fl' } ],
  scheduleButtons: [ { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csulb', variant: 'primary' }, { label: 'Visit our website', href: 'https://csulbnavigators.org/', variant: 'secondary' } ],
  teamOverline: 'CSULB TRUE VINE CLUB',
  teamMembers: [ { name: 'Robert Fishman', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Robert Fishman' } }, { name: 'Jorge Lau', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Jorge Lau' } } ],
  campusName: 'CSULB',
})
console.log('  Created CSULB campus page')

// CSUF
await createCampusPage({
  slug: 'csuf', title: 'CSUF Campus Ministry', metaDescription: 'LA UBF campus ministry at Cal State Fullerton \u2014 Bible study and fellowship for CSUF students.', sortOrder: 22,
  heading: 'CSUF', ctaHref: 'https://startbiblestudy.org/csuf',
  socialLinks: [ { platform: 'Instagram', href: 'https://instagram.com/fullertonbiblefellowship' } ],
  heroImage: { src: '', alt: 'CSUF campus ministry' },
  introDescription: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
  scheduleEntries: [ { day: 'Thursdays', time: '11:30 AM', location: 'A table in front of Health Center' } ],
  scheduleButtons: [ { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csuf', variant: 'primary' } ],
  teamOverline: 'CSUF',
  teamMembers: [ { name: 'Daniel Shim', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Daniel Shim' } }, { name: 'Joseph Cho', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Joseph Cho' } } ],
  campusName: 'CSUF',
})
console.log('  Created CSUF campus page')

// Remaining campuses with minimal data
const minimalCampuses = [
  { slug: 'ucla', title: 'UCLA Campus Ministry', name: 'UCLA', sortOrder: 23 },
  { slug: 'usc', title: 'USC Campus Ministry', name: 'USC', sortOrder: 24 },
  { slug: 'csudh', title: 'CSUDH Campus Ministry', name: 'CSUDH', sortOrder: 25 },
  { slug: 'ccc', title: 'CCC Campus Ministry', name: 'CCC', sortOrder: 26 },
  { slug: 'mt-sac', title: 'Mt. SAC Campus Ministry', name: 'Mt. SAC', sortOrder: 27 },
  { slug: 'golden-west', title: 'Golden West Campus Ministry', name: 'Golden West', sortOrder: 28 },
  { slug: 'cypress', title: 'Cypress Campus Ministry', name: 'Cypress College', sortOrder: 29 },
  { slug: 'cal-poly-pomona', title: 'Cal Poly Pomona Campus Ministry', name: 'Cal Poly Pomona', sortOrder: 30 },
]
for (const c of minimalCampuses) {
  await createCampusPage({
    slug: c.slug, title: c.title, metaDescription: `LA UBF campus ministry at ${c.name} \u2014 Bible study and fellowship for ${c.name} students.`, sortOrder: c.sortOrder,
    heading: c.name.toUpperCase(), ctaHref: `https://startbiblestudy.org/${c.slug}`,
    socialLinks: [], heroImage: { src: '', alt: `${c.name} campus ministry` },
    introDescription: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
    scheduleEntries: [], scheduleButtons: [ { label: 'Start Bible Study', href: `https://startbiblestudy.org/${c.slug}`, variant: 'primary' } ],
    teamOverline: c.name.toUpperCase(), teamMembers: defaultTeamMembers,
    campusName: c.name,
  })
  console.log(`  Created ${c.name} campus page`)
}

// ── I'M NEW PAGE ───────────────────────────────────────────
await createPageWithSections(
  { slug: 'im-new', title: "I'm New", metaDescription: "Planning your first visit to LA UBF? Here's everything you need to know.", sortOrder: 12 },
  [
    { sectionType: 'PAGE_HERO', label: 'Welcome Hero', colorScheme: 'LIGHT', content: { overline: 'New here?', heading: "We\u2019re glad you\u2019re here.", primaryButton: { label: 'Plan Your Visit', href: '#plan-visit', visible: true }, secondaryButton: { label: 'FREQUENTLY ASKED QUESTIONS', href: '#faq', visible: true }, floatingImages: [ { src: `${CDN}/compressed-baptism.jpg`, alt: 'Baptism', width: 219, height: 146 }, { src: `${CDN}/compressed-beach%20camp.jpg`, alt: 'Beach camp', width: 186, height: 133 }, { src: `${CDN}/compressed-face%20paint.jpg`, alt: 'Community event', width: 311, height: 249 }, { src: `${CDN}/compressed-josh.jpg`, alt: 'Fellowship', width: 133, height: 106 }, { src: `${CDN}/compressed-sports.jpg`, alt: 'Sports fellowship', width: 216, height: 144 }, { src: `${CDN}/compressed-worship.jpg`, alt: 'Worship service', width: 288, height: 199 } ] } },
    { sectionType: 'FEATURE_BREAKDOWN', label: 'What is UBF', colorScheme: 'DARK', content: { heading: 'What is \u201cUBF\u201d?', description: "University Bible Fellowship (UBF) is an international, non-denominational evangelical church centered on Bible study and discipleship. We especially serve college students, raising lifelong disciples of Jesus Christ who love one another and take part in God\u2019s global mission.", acronymLines: ['University', 'Bible', 'Fellowship'], button: { label: 'More about us', href: '/about', visible: true } } },
    { sectionType: 'PATHWAY_CARD', label: 'How to Get Started', colorScheme: 'LIGHT', content: { heading: 'How to Get Started at LA UBF', description: "We know visiting a new church can feel intimidating. We want to make your first experience as seamless and welcoming as possible. Here are the best ways to connect with our community.", cards: [ { icon: 'book-open', title: 'Join us on Sunday', description: 'Experience our main worship service, gathered in fellowship to praise, study the Word, and grow in faith together through worship.', buttonLabel: 'Service Info', buttonHref: '#what-to-expect', buttonVariant: 'primary' }, { icon: 'graduation-cap', title: 'Are you a College Student?', description: 'Join one of our campus ministries to attend group Bible studies, connect with other students, and grow spiritually during college.', buttonLabel: 'View Our Campuses', buttonHref: '#campus-ministry', buttonVariant: 'primary' }, { icon: 'calendar', title: 'Not sure where to start?', description: "Start with an upcoming event\u2014an easy way to meet people and explore what LA UBF is all about at your own pace.", buttonLabel: 'View all events', buttonHref: '/events', buttonVariant: 'secondary' } ] } },
    { sectionType: 'TIMELINE_SECTION', label: 'What to Expect', colorScheme: 'DARK', content: { overline: 'SUNDAY SERVICE', heading: 'What to Expect on Sunday', anchorId: 'what-to-expect', imageSrc: `${CDN}/compressed-visit-us.jpg`, imageAlt: 'LA UBF church building', items: [ { time: '10:00 am', title: 'Bible Studies & Gathering', description: "Personal Bible studies take place before worship. Let us know you\u2019re interested and we\u2019ll help you connect." }, { time: '11:00 am', title: 'Worship Service', description: 'Join us for Sunday worship with a special song, a worship message, and praise together.' }, { time: '12:30 pm', title: 'Lunch & Fellowship', description: 'Stay after service for lunch and fellowship, with food prepared by our community and time to connect.' } ] } },
    { sectionType: 'LOCATION_DETAIL', label: 'When & Where', colorScheme: 'DARK', content: { overline: 'WHEN & WHERE', images: [ { src: `${CDN}/compressed-laubf-location.png`, alt: 'LA UBF building exterior' } ], address: ['11625 Paramount Blvd,', 'Downey, CA 90241'], directionsUrl: 'https://maps.google.com/?q=11625+Paramount+Boulevard+Downey+CA', directionsLabel: 'Get Directions', timeLabel: 'Time', timeValue: 'Every Sunday\n@ 11 AM', locationLabel: 'Location' } },
    { sectionType: 'CAMPUS_CARD_GRID', label: 'Campus Ministry', colorScheme: 'LIGHT', content: { ...sharedCampusGrid, overline: 'Are you a college student?', anchorId: 'campus-ministry', ctaButton: { label: 'Let us know your interest', href: '#plan-visit' }, ctaHeading: "Don\u2019t see your campus?", showCtaIcon: true } },
    { sectionType: 'FORM_SECTION', label: 'Plan Your Visit', colorScheme: 'DARK', content: { ...sharedFormContent, anchorId: 'plan-visit', heading: 'Let us help you start', description: "Let us know you\u2019re coming and we\u2019ll save a seat for you! We can also help match you with a Bible teacher or answer any questions about our ministries." } },
    { sectionType: 'FAQ_SECTION', label: 'FAQ', colorScheme: 'LIGHT', containerWidth: 'NARROW', content: { heading: 'Frequently Asked Questions', anchorId: 'faq', showIcon: true, items: [ { question: 'What should I expect on my first Sunday visit?', answer: "Our Sunday worship service is about 90 minutes and includes praise, prayer, and a sermon. Dress is casual\u2014come as you are. You\u2019re welcome to sit anywhere, and someone from our welcome team will be happy to help you get settled." }, { question: 'Do I need to know the Bible to attend?', answer: 'Not at all! Many of our members started with little or no Bible knowledge. Our studies are designed to be accessible to everyone, and our leaders are happy to walk alongside you at your own pace.' }, { question: 'Is there parking available at the church?', answer: 'Yes, we have a free parking lot on-site behind the building. Street parking is also available on Paramount Blvd and surrounding blocks.' }, { question: 'How can I get connected beyond Sunday service?', answer: "We\u2019d love for you to join a small group Bible study, attend one of our fellowship events, or serve on a ministry team. Fill out the contact form on this page and we\u2019ll help you find the best next step." } ] } },
  ],
)
console.log("  Created I'm New page")

// ── GIVING PAGE ────────────────────────────────────────────
await createPageWithSections(
  { slug: 'giving', title: 'Giving', metaDescription: 'Support the mission of LA UBF through generous giving.', sortOrder: 13 },
  [
    { sectionType: 'PAGE_HERO', label: 'Giving Hero', colorScheme: 'LIGHT', content: { overline: 'COMING SOON', heading: 'Giving' } },
    { sectionType: 'STATEMENT', label: 'Giving Info', colorScheme: 'LIGHT', visible: false, content: { heading: 'Giving', paragraphs: [ { text: 'This page is coming soon.', isBold: false } ] } },
  ],
)
console.log('  Created giving page')

// ============================================================
// Done
// ============================================================
console.log('\n✅ Website data applied successfully!')
console.log(`   Theme + customization, site settings, 2 menus, ${await prisma.page.count({ where: { churchId } })} pages, ${await prisma.pageSection.count({ where: { churchId } })} sections`)

await prisma.$disconnect()
await pool.end()
