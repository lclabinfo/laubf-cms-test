/**
 * Build a mapping from old nested paths (as used in seed.mts) to new flat filenames.
 * Outputs sed commands to transform the seed file.
 */
import { basename, extname } from 'path'

// These are the old paths used in the seed (relative to CDN base, i.e. after la-ubf/initial-setup/)
const OLD_PATHS = [
  'images/compressed/compressed-cross.png',
  'images/compressed/compressed-campus-ministry.jpg',
  'images/compressed/compressed-event-1.jpg',
  'images/compressed/compressed-event-2.jpg',
  'images/compressed/compressed-event-3.jpg',
  'images/compressed/compressed-hero-bg.jpg',
  'images/compressed/compressed-next-step-1.jpg',
  'images/compressed/compressed-next-step-2.jpg',
  'images/compressed/compressed-next-step-3.jpg',
  'images/compressed/compressed-next-step-4.jpg',
  'images/compressed/compressed-sermon-thumbnail.jpg',
  'images/compressed/compressed-video-1.jpg',
  'images/compressed/compressed-video-2.jpg',
  'images/compressed/compressed-video-3.jpg',
  'images/compressed/compressed-visit-us-bg.jpg',
  'images/compressed/compressed-who-we-are-1.jpg',
  'images/compressed/compressed-who-we-are-2.jpg',
  'images/compressed/compressed-who-we-are-3.jpg',
  'images/compressed/home/compressed-bible-study.png',
  'images/compressed/home/compressed-campus-ministry-list.png',
  'images/compressed/home/compressed-campus-ministry.jpg',
  'images/compressed/home/compressed-event-christmas.png',
  'images/compressed/home/compressed-fellowship.jpg',
  'images/compressed/home/compressed-sunday-worship.jpg',
  'images/compressed/home/compressed-visit-us.jpg',
  'images/compressed/home/rotatingwheel/compressed-bible-study.png',
  'images/compressed/home/rotatingwheel/compressed-campus-ministry-list.png',
  'images/compressed/home/rotatingwheel/compressed-campus-ministry.jpg',
  'images/compressed/home/rotatingwheel/compressed-event-christmas.png',
  'images/compressed/home/rotatingwheel/compressed-fellowship.jpg',
  'images/compressed/home/rotatingwheel/compressed-sunday-worship.jpg',
  "images/compressed/i'm new/compressed-laubf-location.png",
  "images/compressed/i'm new/header photos/compressed-baptism.jpg",
  "images/compressed/i'm new/header photos/compressed-beach camp.jpg",
  "images/compressed/i'm new/header photos/compressed-face paint.jpg",
  "images/compressed/i'm new/header photos/compressed-josh.jpg",
  "images/compressed/i'm new/header photos/compressed-sports.jpg",
  "images/compressed/i'm new/header photos/compressed-worship.jpg",
  'images/compressed/ministries/compressed-adults.webp',
  'images/compressed/ministries/compressed-children.webp',
  'images/compressed/ministries/compressed-congregation.jpg',
  'images/compressed/ministries/compressed-middle n high.jpg',
  'images/compressed/ministries/compressed-young adults.jpg',
  'images/compressed/ministries/adults/compressed-disciples.jpg',
  'images/compressed/ministries/adults/compressed-growing.jpg',
  'images/compressed/ministries/adults/compressed-introduction.jpg',
  'images/compressed/ministries/adults/compressed-serving.jpg',
  'images/compressed/ministries/children/compressed-child care.jpg',
  'images/compressed/ministries/children/compressed-class.jpg',
  'images/compressed/ministries/children/compressed-introduction.png',
  'images/compressed/ministries/children/compressed-service.png',
  'images/compressed/ministries/children/compressed-singspiration.jpg',
  'images/compressed/ministries/csulb/compressed-IMG_1407.jpg',
  'images/compressed/ministries/csulb/compressed-IMG_1408.jpg',
  'images/compressed/ministries/csulb/compressed-IMG_1409.jpg',
  'images/compressed/ministries/csulb/compressed-IMG_1411.jpg',
  'images/compressed/ministries/csulb/compressed-IMG_1413.jpg',
  'images/compressed/ministries/csulb/compressed-hero.jpg',
  'images/compressed/ministries/csulb/compressed-waving.jpg',
  'images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg',
  'images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg',
  'images/compressed/ministries/join-campus-ministry-section/compressed-3.png',
  'images/compressed/ministries/lbcc/compressed-lbcc-truevineclub.jpg',
  'images/compressed/ministries/middle n high/compressed-fellowship.jpg',
  'images/compressed/ministries/middle n high/compressed-header.jpg',
  'images/compressed/ministries/middle n high/compressed-introduction.jpg',
  'images/compressed/ministries/middle n high/compressed-jbfhbf conference.jpg',
  'images/compressed/ministries/middle n high/compressed-praise night.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-1.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-2.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-3.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-4.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-5.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-6.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-7.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-8.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-9.jpg',
  'images/compressed/ministries/young adults/carousel/compressed-10.jpg',
  'images/compressed/ministries/young adults/compressed-fellowship.png',
  'images/compressed/ministries/young adults/compressed-serving.jpg',
  'images/compressed/ministries/young adults/compressed-yam.png',
  'images/compressed/who we are/compressed-bible study.jpg',
  'images/compressed/who we are/compressed-discipleship.jpg',
  'images/compressed/who we are/compressed-fellowship.jpg',
  'images/compressed/who we are/compressed-header.jpg',
  'logo/laubf-logo-blue.svg',
  'logo/laubf-logo-colored.png',
  'logo/laubf-logo.svg',
  'pics-temp/DSC01195.jpg',
  'pics-temp/DSC05222.jpg',
  'pics-temp/DSC05299.jpg',
  'videos/compressed-hero-vid.mp4',
  'videos/compressed-hero-vid.webm',
]

// Same dedup logic as flatten script
const filenameCount = new Map<string, number>()
for (const p of OLD_PATHS) {
  const fn = basename(p)
  filenameCount.set(fn, (filenameCount.get(fn) ?? 0) + 1)
}

function flatName(oldPath: string): string {
  const fn = basename(oldPath)
  if (filenameCount.get(fn) === 1) return fn
  const parts = oldPath.split('/')
  parts.pop()
  const prefix = parts.filter(p => p !== 'compressed').join('-')
  return prefix ? `${prefix}-${fn}` : fn
}

// Output the mapping as JSON
const mapping: Record<string, string> = {}
for (const p of OLD_PATHS) {
  mapping[p] = flatName(p)
}
console.log(JSON.stringify(mapping, null, 2))
