/**
 * Centralized Bible version definitions.
 * Used across the CMS entry forms, website study detail view, and Bible API utilities.
 *
 * Versions marked `apiAvailable: true` have verse text in the local BibleVerse database
 * and can be displayed inline on the study detail page.
 *
 * Copyright notices are sourced from each publisher's official permissions page and must
 * be displayed wherever Bible text from that version is rendered on the public website.
 */

export interface BibleVersion {
  code: string
  name: string
  abbreviation: string
  language: string
  isDefault?: boolean
  /** True if this version has text in the local BibleVerse database. */
  apiAvailable?: boolean
}

/* ── Bible Version Copyright Notices ── */

/**
 * Copyright information for Bible versions displayed on the platform.
 * Each entry contains the legally required copyright notice text and the
 * abbreviated inline form suitable for non-saleable church media (e.g., bulletins).
 *
 * Sources:
 * - NIV: https://www.biblica.com/permissions/
 * - ESV: https://www.crossway.org/permissions/
 * - NASB: https://www.lockman.org/permission-to-quote-copyright-trademark-information/
 * - NLT: https://www.tyndale.com/permissions
 * - KJV: Public domain (outside the United Kingdom)
 * - AMP: https://www.lockman.org/permission-to-quote-copyright-trademark-information/
 */
export interface BibleCopyrightInfo {
  /** Version code matching BibleVersion.code */
  code: string
  /** Full copyright notice required on pages displaying Bible text */
  fullNotice: string
  /** Short inline attribution for non-saleable media (e.g., "(NIV)") */
  inlineAttribution: string
  /** Whether this version is public domain (no copyright required) */
  isPublicDomain: boolean
  /** Publisher or rights holder */
  publisher: string
  /** URL for permission details */
  permissionsUrl?: string
}

export const BIBLE_COPYRIGHT_INFO: Record<string, BibleCopyrightInfo> = {
  NIV: {
    code: "NIV",
    fullNotice:
      'Scripture quotations taken from the Holy Bible, New International Version\u00AE, NIV\u00AE. Copyright \u00A9 1973, 1978, 1984, 2011 by Biblica, Inc.\u00AE Used by permission. All rights reserved worldwide.',
    inlineAttribution: "(NIV\u00AE)",
    isPublicDomain: false,
    publisher: "Biblica, Inc.",
    permissionsUrl: "https://www.biblica.com/permissions/",
  },
  ESV: {
    code: "ESV",
    fullNotice:
      'Scripture quotations are from the ESV\u00AE Bible (The Holy Bible, English Standard Version\u00AE), copyright \u00A9 2001 by Crossway, a publishing ministry of Good News Publishers. ESV Text Edition: 2025. Used by permission. All rights reserved.',
    inlineAttribution: "(ESV)",
    isPublicDomain: false,
    publisher: "Crossway",
    permissionsUrl: "https://www.crossway.org/permissions/",
  },
  KJV: {
    code: "KJV",
    fullNotice:
      "Scripture quotations from the King James Version (KJV) are in the public domain.",
    inlineAttribution: "(KJV)",
    isPublicDomain: true,
    publisher: "Public Domain",
  },
  NLT: {
    code: "NLT",
    fullNotice:
      'Scripture quotations are taken from the Holy Bible, New Living Translation, copyright \u00A9 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.',
    inlineAttribution: "(NLT)",
    isPublicDomain: false,
    publisher: "Tyndale House Publishers",
    permissionsUrl: "https://www.tyndale.com/permissions",
  },
  NASB: {
    code: "NASB",
    fullNotice:
      'Scripture quotations taken from the (NASB\u00AE) New American Standard Bible\u00AE, Copyright \u00A9 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. All rights reserved. www.lockman.org',
    inlineAttribution: "(NASB\u00AE)",
    isPublicDomain: false,
    publisher: "The Lockman Foundation",
    permissionsUrl: "https://www.lockman.org/permission-to-quote-copyright-trademark-information/",
  },
  AMP: {
    code: "AMP",
    fullNotice:
      'Scripture quotations taken from the Amplified\u00AE Bible (AMP), Copyright \u00A9 2015 by The Lockman Foundation. Used by permission. www.lockman.org',
    inlineAttribution: "(AMP)",
    isPublicDomain: false,
    publisher: "The Lockman Foundation",
    permissionsUrl: "https://www.lockman.org/permission-to-quote-copyright-trademark-information/",
  },
}

/**
 * Returns the copyright info for a given version code.
 * Falls back to a generic notice if the version is not in the registry.
 */
export function getBibleCopyright(versionCode: string): BibleCopyrightInfo {
  const upper = versionCode.toUpperCase()
  return BIBLE_COPYRIGHT_INFO[upper] ?? {
    code: upper,
    fullNotice: `Scripture quotations from the ${upper} translation.`,
    inlineAttribution: `(${upper})`,
    isPublicDomain: false,
    publisher: "Unknown",
  }
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  // Primary English versions (available locally)
  { code: "ESV", name: "English Standard Version", abbreviation: "ESV", language: "English", isDefault: true, apiAvailable: true },
  { code: "NIV", name: "New International Version", abbreviation: "NIV", language: "English", apiAvailable: true },
  { code: "KJV", name: "King James Version", abbreviation: "KJV", language: "English", apiAvailable: true },
  { code: "NLT", name: "New Living Translation", abbreviation: "NLT", language: "English", apiAvailable: true },
  { code: "NASB", name: "New American Standard Bible", abbreviation: "NASB", language: "English", apiAvailable: true },
  { code: "AMP", name: "Amplified Bible", abbreviation: "AMP", language: "English" },
  // English versions without local text (link to BibleGateway instead)
  { code: "NKJV", name: "New King James Version", abbreviation: "NKJV", language: "English" },
  { code: "CSB", name: "Christian Standard Bible", abbreviation: "CSB", language: "English" },
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

/** Versions with text in the local BibleVerse database (for the public site version switcher). */
export const API_AVAILABLE_VERSIONS = BIBLE_VERSIONS.filter(v => v.apiAvailable)

export const DEFAULT_BIBLE_VERSION = BIBLE_VERSIONS.find(v => v.isDefault) || BIBLE_VERSIONS[0]

export function getBibleVersionByCode(code: string): BibleVersion | undefined {
  return BIBLE_VERSIONS.find(v => v.code === code)
}
