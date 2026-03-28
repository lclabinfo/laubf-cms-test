import { revalidateTag } from 'next/cache'

/** Immediately expire cache entries for the given tag */
const EXPIRE_NOW = { expire: 0 } as const

export function invalidateSermons(churchId: string) {
  revalidateTag(`church:${churchId}:sermons`, EXPIRE_NOW)
  revalidateTag(`church:${churchId}:pages`, EXPIRE_NOW)
}

export function invalidateEvents(churchId: string) {
  revalidateTag(`church:${churchId}:events`, EXPIRE_NOW)
  revalidateTag(`church:${churchId}:pages`, EXPIRE_NOW)
}

export function invalidateStudies(churchId: string) {
  revalidateTag(`church:${churchId}:studies`, EXPIRE_NOW)
  revalidateTag(`church:${churchId}:pages`, EXPIRE_NOW)
}

export function invalidateVideos(churchId: string) {
  revalidateTag(`church:${churchId}:videos`, EXPIRE_NOW)
  revalidateTag(`church:${churchId}:pages`, EXPIRE_NOW)
}

export function invalidatePages(churchId: string) {
  revalidateTag(`church:${churchId}:pages`, EXPIRE_NOW)
}

export function invalidateLayout(churchId: string) {
  revalidateTag(`church:${churchId}:menus`, EXPIRE_NOW)
  revalidateTag(`church:${churchId}:settings`, EXPIRE_NOW)
  revalidateTag(`church:${churchId}:theme`, EXPIRE_NOW)
}

export function invalidateTheme(churchId: string) {
  revalidateTag(`church:${churchId}:theme`, EXPIRE_NOW)
}

export function invalidateDailyBread(churchId: string) {
  revalidateTag(`church:${churchId}:daily-bread`, EXPIRE_NOW)
}

export function invalidatePeople(churchId: string) {
  revalidateTag(`church:${churchId}:people`, EXPIRE_NOW)
}
