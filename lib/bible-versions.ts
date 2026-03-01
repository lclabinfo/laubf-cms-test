/**
 * Centralized Bible version definitions.
 * Used across the CMS entry forms, website study detail view, and Bible API utilities.
 */

export interface BibleVersion {
  code: string
  name: string
  abbreviation: string
  language: string
  isDefault?: boolean
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  { code: "ESV", name: "English Standard Version", abbreviation: "ESV", language: "English", isDefault: true },
  { code: "NIV", name: "New International Version", abbreviation: "NIV", language: "English" },
  { code: "KJV", name: "King James Version", abbreviation: "KJV", language: "English" },
  { code: "NKJV", name: "New King James Version", abbreviation: "NKJV", language: "English" },
  { code: "NLT", name: "New Living Translation", abbreviation: "NLT", language: "English" },
  { code: "NASB", name: "New American Standard Bible", abbreviation: "NASB", language: "English" },
  { code: "CSB", name: "Christian Standard Bible", abbreviation: "CSB", language: "English" },
  { code: "AMP", name: "Amplified Bible", abbreviation: "AMP", language: "English" },
  { code: "MSG", name: "The Message", abbreviation: "MSG", language: "English" },
  { code: "CEV", name: "Contemporary English Version", abbreviation: "CEV", language: "English" },
  { code: "GNT", name: "Good News Translation", abbreviation: "GNT", language: "English" },
  { code: "RSV", name: "Revised Standard Version", abbreviation: "RSV", language: "English" },
  { code: "NRSV", name: "New Revised Standard Version", abbreviation: "NRSV", language: "English" },
  { code: "NET", name: "New English Translation", abbreviation: "NET", language: "English" },
  { code: "WEB", name: "World English Bible", abbreviation: "WEB", language: "English" },
  { code: "ASV", name: "American Standard Version", abbreviation: "ASV", language: "English" },
  { code: "YLT", name: "Young's Literal Translation", abbreviation: "YLT", language: "English" },
  { code: "HCSB", name: "Holman Christian Standard Bible", abbreviation: "HCSB", language: "English" },
  { code: "ISV", name: "International Standard Version", abbreviation: "ISV", language: "English" },
  { code: "ERV", name: "Easy-to-Read Version", abbreviation: "ERV", language: "English" },
]

export const DEFAULT_BIBLE_VERSION = BIBLE_VERSIONS.find(v => v.isDefault) || BIBLE_VERSIONS[0]

export function getBibleVersionByCode(code: string): BibleVersion | undefined {
  return BIBLE_VERSIONS.find(v => v.code === code)
}
