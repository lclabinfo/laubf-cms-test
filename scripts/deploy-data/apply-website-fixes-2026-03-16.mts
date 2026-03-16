/**
 * Apply website data fixes from 2026-03-16.
 *
 * Changes:
 *   1. Fix LBCC campus social links (Instagram → truevine_lbcc)
 *   2. Add "How do I sign up?" FAQ to campus pages that lack it
 *   3. Set correct visibility for "Snippets from the Ministry" per page
 *   4. Fix parking FAQ text on I'm New page (remove "parking team" line)
 *   5. Remove "Where and when do campus groups meet?" FAQ from all pages
 *   6. Update "Let us know your interest" CTA href on home page → /im-new#plan-visit
 *   7. Add showCtaIcon: false to CAMPUS_CARD_GRID on ministries overview page
 *   8. Add answerHtml to "How do I sign up?" FAQ items on campus pages (with social links check)
 *   9. Restore "Snippets from the Ministry" on Young Adult page, keep hidden on High School page
 *  10. Fix calendar CTA button href on home page (remove ?month=2 query param)
 *  11. Giving page: "Coming Soon" overline + hide Statement section
 *  12. Rename "This Week's Message" → "Latest Message" on SPOTLIGHT_MEDIA sections
 *  13. Fix college page CAMPUS_CARD_GRID: href to /im-new#plan-visit + showCtaIcon: false
 *  14. Set showCtaIcon: true on I'm New page CAMPUS_CARD_GRID
 *  15. Replace Sunday Worship image with sunday-praise.webp + add to media library
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 * It only updates specific fields and does not delete/recreate anything.
 *
 * Usage: npx tsx scripts/deploy-data/apply-website-fixes-2026-03-16.mts
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
// 1. Fix LBCC campus social links (Instagram URL)
// ============================================================
console.log('── 1. Fixing LBCC campus social links ──')

const lbccPage = await prisma.page.findFirst({
  where: { churchId, slug: 'ministries/campus/lbcc' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!lbccPage) {
  console.warn('  ⚠ LBCC campus page not found — skipping')
} else {
  const heroSection = lbccPage.sections.find(s => s.sectionType === 'MINISTRY_HERO')
  if (!heroSection) {
    console.warn('  ⚠ LBCC MINISTRY_HERO section not found — skipping')
  } else {
    const content = heroSection.content as Record<string, unknown>
    const socialLinks = content.socialLinks as Array<{ platform: string; href: string }> | undefined

    if (!socialLinks) {
      console.warn('  ⚠ No socialLinks found in LBCC hero — skipping')
    } else {
      const correctInstagram = 'https://www.instagram.com/truevine_lbcc/'
      const igLink = socialLinks.find(l => l.platform === 'Instagram')

      if (igLink && igLink.href === correctInstagram) {
        console.log(`  ✓ LBCC Instagram already correct: ${correctInstagram}`)
      } else {
        const updatedLinks = socialLinks.map(l => {
          if (l.platform === 'Instagram') {
            return { ...l, href: correctInstagram }
          }
          return l
        })

        // If no Instagram link existed, add one
        if (!igLink) {
          updatedLinks.push({ platform: 'Instagram', href: correctInstagram })
        }

        await prisma.pageSection.update({
          where: { id: heroSection.id },
          data: { content: { ...content, socialLinks: updatedLinks } },
        })
        console.log(`  ✓ Updated LBCC Instagram → ${correctInstagram}`)
      }
    }
  }
}

// ============================================================
// 2. Add "How do I sign up?" FAQ item to campus pages
// ============================================================
console.log('\n── 2. Adding "How do I sign up?" FAQ to campus pages ──')

const campusPages = await prisma.page.findMany({
  where: { churchId, slug: { startsWith: 'ministries/campus/' } },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

const signUpQuestion = 'How do I sign up?'

for (const page of campusPages) {
  const campusSlug = page.slug.replace('ministries/campus/', '')
  const faqSection = page.sections.find(s => s.sectionType === 'FAQ_SECTION')

  if (!faqSection) {
    console.log(`  ⚠ ${campusSlug}: no FAQ_SECTION found — skipping`)
    continue
  }

  const content = faqSection.content as Record<string, unknown>
  const items = (content.items || []) as Array<{ question: string; answer: string }>

  // Check if "How do I sign up?" already exists
  const alreadyHas = items.some(item => item.question === signUpQuestion)
  if (alreadyHas) {
    console.log(`  ✓ ${campusSlug}: already has "${signUpQuestion}" FAQ`)
    continue
  }

  // Determine the campus's Start Bible Study link and social links from the hero section
  const heroSection = page.sections.find(s => s.sectionType === 'MINISTRY_HERO')
  const heroContent = heroSection?.content as Record<string, unknown> | undefined
  const ctaButton = heroContent?.ctaButton as { href?: string } | undefined
  const startBsHref = ctaButton?.href || `https://startbiblestudy.org/${campusSlug}`
  const heroSocialLinks = (heroContent?.socialLinks || []) as Array<{ platform: string; href: string }>
  const heroHasSocialLinks = heroSocialLinks.length > 0

  const newItem = {
    question: signUpQuestion,
    answer: `It\u2019s easy! Visit the Start Bible Study link to fill out a short form.${heroHasSocialLinks ? ' You can also email or reach out to us via our social media listed at the top of this page.' : ''} We\u2019ll get you connected with a Bible study group right away.`,
    answerHtml: `It\u2019s easy! Visit <a href="${startBsHref}" target="_blank" rel="noopener noreferrer">Start Bible Study</a> to fill out a short form.${heroHasSocialLinks ? ' You can also email or reach out to us via our social media listed at the top of this page.' : ''} We\u2019ll get you connected with a Bible study group right away.`,
  }

  // Insert as first FAQ item
  const updatedItems = [newItem, ...items]

  await prisma.pageSection.update({
    where: { id: faqSection.id },
    data: { content: { ...content, items: updatedItems } },
  })
  console.log(`  ✓ ${campusSlug}: added "${signUpQuestion}" FAQ`)
}

// ============================================================
// 3. Set correct visibility for "Snippets from the Ministry" PHOTO_GALLERY sections
//    - Young Adult (college) page: visible = true
//    - JBF/HBF (high-school) page: visible = false
// ============================================================
console.log('\n── 3. Setting "Snippets from the Ministry" photo gallery visibility ──')

const snippetSections = await prisma.pageSection.findMany({
  where: {
    churchId,
    sectionType: 'PHOTO_GALLERY',
  },
  include: { page: { select: { slug: true } } },
})

for (const section of snippetSections) {
  const sContent = section.content as Record<string, unknown>
  if (sContent.heading !== 'Snippets from the Ministry') continue

  const sectionWithPage = section as typeof section & { page: { slug: string } | null }
  const pageSlug = sectionWithPage.page?.slug || ''
  // Young Adult / College page -> visible; all others (JBF/HBF, etc.) -> hidden
  const shouldBeVisible = pageSlug === 'ministries/college'

  if (section.visible === shouldBeVisible) {
    console.log(`  ✓ Section "${section.label}" on ${pageSlug} already ${shouldBeVisible ? 'visible' : 'hidden'}`)
    continue
  }
  await prisma.pageSection.update({
    where: { id: section.id },
    data: { visible: shouldBeVisible },
  })
  console.log(`  ✓ Set section "${section.label}" on ${pageSlug} to visible=${shouldBeVisible}`)
}

// ============================================================
// 4. Fix parking FAQ text on I'm New page
// ============================================================
console.log('\n── 4. Fixing parking FAQ text on I\'m New page ──')

const imNewPage = await prisma.page.findFirst({
  where: { churchId, slug: 'im-new' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!imNewPage) {
  console.warn('  ⚠ I\'m New page not found — skipping')
} else {
  const faqSection = imNewPage.sections.find(s => s.sectionType === 'FAQ_SECTION')
  if (!faqSection) {
    console.warn('  ⚠ FAQ_SECTION not found on I\'m New page — skipping')
  } else {
    const content = faqSection.content as Record<string, unknown>
    const items = (content.items || []) as Array<{ question: string; answer: string }>

    const parkingOldAnswer = 'Yes, we have a free parking lot on-site. Street parking is also available on the surrounding blocks. If the lot is full, our parking team can help direct you.'
    const parkingNewAnswer = 'Yes, we have a free parking lot on-site behind the building. Street parking is also available on Paramount Blvd and surrounding blocks.'

    const parkingItem = items.find(i => i.question === 'Is there parking available at the church?')
    if (!parkingItem) {
      console.log('  ✓ No parking FAQ item found — skipping')
    } else if (parkingItem.answer === parkingNewAnswer) {
      console.log('  ✓ Parking FAQ already updated')
    } else {
      const updatedItems = items.map(i => {
        if (i.question === 'Is there parking available at the church?') {
          return { ...i, answer: parkingNewAnswer }
        }
        return i
      })

      await prisma.pageSection.update({
        where: { id: faqSection.id },
        data: { content: { ...content, items: updatedItems } },
      })
      console.log(`  ✓ Updated parking FAQ answer (removed "parking team" text)`)
    }
  }
}

// ============================================================
// 5. Remove "Where and when do campus groups meet?" FAQ from ALL pages
// ============================================================
console.log('\n── 5. Removing "Where and when do campus groups meet?" FAQ from all pages ──')

const campusQuestion = 'Where and when do campus groups meet?'
const allFaqSections = await prisma.pageSection.findMany({
  where: { churchId, sectionType: 'FAQ_SECTION' },
})

let removedCount = 0
for (const faqSection of allFaqSections) {
  const content = faqSection.content as Record<string, unknown>
  const items = (content.items || []) as Array<{ question: string; answer: string }>

  const hasItem = items.some(i => i.question === campusQuestion)
  if (!hasItem) continue

  const filteredItems = items.filter(i => i.question !== campusQuestion)
  await prisma.pageSection.update({
    where: { id: faqSection.id },
    data: { content: { ...content, items: filteredItems } },
  })
  console.log(`  ✓ Removed from section ${faqSection.id} (${faqSection.label || 'unnamed'})`)
  removedCount++
}
if (removedCount === 0) {
  console.log('  ✓ No pages had this FAQ item')
} else {
  console.log(`  ✓ Removed from ${removedCount} FAQ section(s)`)
}

// ============================================================
// 6. Update "Let us know your interest" CTA href on home page
// ============================================================
console.log('\n── 6. Updating CTA href on home page DIRECTORY_LIST ──')

const homePage = await prisma.page.findFirst({
  where: { churchId, isHomepage: true },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!homePage) {
  console.warn('  ⚠ Home page not found — skipping')
} else {
  const directorySection = homePage.sections.find(s => {
    if (s.sectionType !== 'DIRECTORY_LIST') return false
    const c = s.content as Record<string, unknown>
    return c.ctaHeading === "Don't see your campus?"
  })

  if (!directorySection) {
    console.warn('  ⚠ DIRECTORY_LIST with "Don\'t see your campus?" not found on home page — skipping')
  } else {
    const content = directorySection.content as Record<string, unknown>
    const ctaButton = content.ctaButton as { label: string; href: string } | undefined

    if (!ctaButton) {
      console.warn('  ⚠ No ctaButton found in DIRECTORY_LIST section — skipping')
    } else if (ctaButton.href === '/im-new#plan-visit') {
      console.log('  ✓ CTA href already set to /im-new#plan-visit')
    } else {
      await prisma.pageSection.update({
        where: { id: directorySection.id },
        data: {
          content: {
            ...content,
            ctaButton: { ...ctaButton, href: '/im-new#plan-visit' },
          },
        },
      })
      console.log('  ✓ Updated CTA href from /im-new → /im-new#plan-visit')
    }
  }
}

// ============================================================
// 7. Add showCtaIcon: false to CAMPUS_CARD_GRID on ministries page
// ============================================================
console.log('\n── 7. Setting showCtaIcon: false on ministries CAMPUS_CARD_GRID ──')

const ministriesPage = await prisma.page.findFirst({
  where: { churchId, slug: 'ministries' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!ministriesPage) {
  console.warn('  ⚠ Ministries page not found — skipping')
} else {
  const campusGridSection = ministriesPage.sections.find(s => s.sectionType === 'CAMPUS_CARD_GRID')

  if (!campusGridSection) {
    console.warn('  ⚠ CAMPUS_CARD_GRID section not found on ministries page — skipping')
  } else {
    const content = campusGridSection.content as Record<string, unknown>

    if (content.showCtaIcon === false) {
      console.log('  ✓ showCtaIcon already set to false')
    } else {
      await prisma.pageSection.update({
        where: { id: campusGridSection.id },
        data: {
          content: { ...content, showCtaIcon: false },
        },
      })
      console.log('  ✓ Added showCtaIcon: false to CAMPUS_CARD_GRID')
    }
  }
}

// ============================================================
// 8. Add answerHtml to "How do I sign up?" FAQ on campus pages
// ============================================================
console.log('\n── 8. Adding answerHtml to "How do I sign up?" FAQ on campus pages ──')

// Re-fetch campus pages to get latest FAQ content (step 2 may have added the item)
const campusPagesForHtml = await prisma.page.findMany({
  where: { churchId, slug: { startsWith: 'ministries/campus/' } },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

for (const page of campusPagesForHtml) {
  const campusSlug = page.slug.replace('ministries/campus/', '')
  const faqSection = page.sections.find(s => s.sectionType === 'FAQ_SECTION')

  if (!faqSection) {
    console.log(`  ⚠ ${campusSlug}: no FAQ_SECTION found — skipping`)
    continue
  }

  const content = faqSection.content as Record<string, unknown>
  const items = (content.items || []) as Array<{ question: string; answer: string; answerHtml?: string }>

  const signUpItem = items.find(i => i.question === 'How do I sign up?')
  if (!signUpItem) {
    console.log(`  ⚠ ${campusSlug}: no "How do I sign up?" FAQ — skipping`)
    continue
  }

  // Determine the campus's Start Bible Study link and social links from the hero section
  const heroSection = page.sections.find(s => s.sectionType === 'MINISTRY_HERO')
  const heroContent = heroSection?.content as Record<string, unknown> | undefined
  const ctaButton = heroContent?.ctaButton as { href?: string } | undefined
  const startBsHref = ctaButton?.href || `https://startbiblestudy.org/${campusSlug}`
  const socialLinks = (heroContent?.socialLinks || []) as Array<{ platform: string; href: string }>
  const hasSocialLinks = socialLinks.length > 0

  const expectedAnswerHtml = `It\u2019s easy! Visit <a href="${startBsHref}" target="_blank" rel="noopener noreferrer">Start Bible Study</a> to fill out a short form.${hasSocialLinks ? ' You can also email or reach out to us via our social media listed at the top of this page.' : ''} We\u2019ll get you connected with a Bible study group right away.`

  if (signUpItem.answerHtml === expectedAnswerHtml) {
    console.log(`  ✓ ${campusSlug}: answerHtml already correct (socialLinks: ${hasSocialLinks})`)
    continue
  }

  const expectedAnswer = `It\u2019s easy! Visit the Start Bible Study link to fill out a short form.${hasSocialLinks ? ' You can also email or reach out to us via our social media listed at the top of this page.' : ''} We\u2019ll get you connected with a Bible study group right away.`

  const updatedItems = items.map(i => {
    if (i.question === 'How do I sign up?') {
      return {
        ...i,
        answer: expectedAnswer,
        answerHtml: expectedAnswerHtml,
      }
    }
    return i
  })

  await prisma.pageSection.update({
    where: { id: faqSection.id },
    data: { content: { ...content, items: updatedItems } },
  })
  console.log(`  ✓ ${campusSlug}: added answerHtml to "How do I sign up?" FAQ`)
}

// ============================================================
// 9. Restore "Snippets from the Ministry" on Young Adult page
// ============================================================
console.log('\n── 9. Restoring Snippets on Young Adult page, keeping hidden on High School ──')

const collegePage = await prisma.page.findFirst({
  where: { churchId, slug: 'ministries/college' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!collegePage) {
  console.warn('  ⚠ College/Young Adult ministry page not found — skipping')
} else {
  const snippetSection = collegePage.sections.find(s => {
    if (s.sectionType !== 'PHOTO_GALLERY') return false
    const c = s.content as Record<string, unknown>
    return c.heading === 'Snippets from the Ministry'
  })

  if (!snippetSection) {
    console.warn('  ⚠ No "Snippets from the Ministry" section found on college page — skipping')
  } else if (snippetSection.visible) {
    console.log('  ✓ College page Snippets already visible')
  } else {
    await prisma.pageSection.update({
      where: { id: snippetSection.id },
      data: { visible: true },
    })
    console.log('  ✓ Set college page Snippets to visible: true')
  }
}

// Verify high school page snippets remain hidden
const hsPage = await prisma.page.findFirst({
  where: { churchId, slug: 'ministries/high-school' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (hsPage) {
  const hsSnippet = hsPage.sections.find(s => {
    if (s.sectionType !== 'PHOTO_GALLERY') return false
    const c = s.content as Record<string, unknown>
    return c.heading === 'Snippets from the Ministry'
  })

  if (hsSnippet && hsSnippet.visible) {
    await prisma.pageSection.update({
      where: { id: hsSnippet.id },
      data: { visible: false },
    })
    console.log('  ✓ Ensured high school page Snippets remains hidden')
  } else {
    console.log('  ✓ High school page Snippets already hidden (or not found)')
  }
}

// ============================================================
// 10. Fix calendar CTA button href on home page
// ============================================================
console.log('\n── 10. Fixing calendar CTA button href on home page ──')

const homePageForCalendar = await prisma.page.findFirst({
  where: { churchId, isHomepage: true },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!homePageForCalendar) {
  console.warn('  ⚠ Home page not found — skipping')
} else {
  const calendarSection = homePageForCalendar.sections.find(s => s.sectionType === 'EVENT_CALENDAR')

  if (!calendarSection) {
    console.warn('  ⚠ EVENT_CALENDAR section not found on home page — skipping')
  } else {
    const content = calendarSection.content as Record<string, unknown>
    const ctaButtons = content.ctaButtons as Array<{ label: string; href: string; icon?: boolean }> | undefined

    if (!ctaButtons) {
      console.warn('  ⚠ No ctaButtons found in EVENT_CALENDAR section — skipping')
    } else {
      const oldHref = 'https://laubf.org/calendar?month=2'
      const newHref = 'https://laubf.org/calendar'
      const calBtn = ctaButtons.find(b => b.href === oldHref)

      if (!calBtn) {
        // Check if already fixed
        const alreadyFixed = ctaButtons.find(b => b.href === newHref)
        if (alreadyFixed) {
          console.log('  ✓ Calendar CTA href already correct')
        } else {
          console.log('  ⚠ Calendar CTA button with old href not found — skipping')
        }
      } else {
        const updatedButtons = ctaButtons.map(b => {
          if (b.href === oldHref) {
            return { ...b, href: newHref }
          }
          return b
        })

        await prisma.pageSection.update({
          where: { id: calendarSection.id },
          data: { content: { ...content, ctaButtons: updatedButtons } },
        })
        console.log(`  ✓ Updated calendar CTA href: removed ?month=2 query param`)
      }
    }
  }
}

// ============================================================
// 11. Giving page: "Coming Soon" overline + hide Statement section
// ============================================================
console.log('\n── 11. Fixing giving page ──')

const givingPage = await prisma.page.findFirst({
  where: { churchId, slug: 'giving' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!givingPage) {
  console.warn('  ⚠ Giving page not found — skipping')
} else {
  // Update PAGE_HERO overline to "COMING SOON"
  const heroSection = givingPage.sections.find(s => s.sectionType === 'PAGE_HERO')
  if (heroSection) {
    const content = heroSection.content as Record<string, unknown>
    if (content.overline === 'COMING SOON') {
      console.log('  ✓ Giving hero overline already set to COMING SOON')
    } else {
      await prisma.pageSection.update({
        where: { id: heroSection.id },
        data: { content: { ...content, overline: 'COMING SOON' } },
      })
      console.log('  ✓ Updated giving hero overline to COMING SOON')
    }
  }

  // Hide STATEMENT section
  const statementSection = givingPage.sections.find(s => s.sectionType === 'STATEMENT')
  if (statementSection) {
    if (!statementSection.visible) {
      console.log('  ✓ Giving statement section already hidden')
    } else {
      await prisma.pageSection.update({
        where: { id: statementSection.id },
        data: { visible: false },
      })
      console.log('  ✓ Hidden giving statement section')
    }
  }
}

// ============================================================
// 12. Rename "This Week's Message" → "Latest Message" on all SPOTLIGHT_MEDIA sections
// ============================================================
console.log('\n── 12. Renaming "This Week\'s Message" → "Latest Message" ──')

const spotlightSections = await prisma.pageSection.findMany({
  where: { churchId, sectionType: 'SPOTLIGHT_MEDIA' },
})

for (const section of spotlightSections) {
  const sContent = section.content as Record<string, unknown>
  if (sContent.sectionHeading === 'This Week\u2019s Message' || sContent.sectionHeading === "This Week's Message") {
    await prisma.pageSection.update({
      where: { id: section.id },
      data: {
        label: 'Latest Message',
        content: { ...sContent, sectionHeading: 'Latest Message' },
      },
    })
    console.log(`  ✓ Updated section ${section.id} heading to "Latest Message"`)
  } else if (sContent.sectionHeading === 'Latest Message') {
    console.log(`  ✓ Section ${section.id} already set to "Latest Message"`)
  }
}

// ============================================================
// 13. Fix college page CAMPUS_CARD_GRID: href + showCtaIcon
// ============================================================
console.log('\n── 13. Fixing college page CAMPUS_CARD_GRID ──')

const collegePageForGrid = await prisma.page.findFirst({
  where: { churchId, slug: 'ministries/college' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!collegePageForGrid) {
  console.warn('  ⚠ College page not found — skipping')
} else {
  const gridSection = collegePageForGrid.sections.find(s => s.sectionType === 'CAMPUS_CARD_GRID')
  if (!gridSection) {
    console.warn('  ⚠ CAMPUS_CARD_GRID not found on college page — skipping')
  } else {
    const gContent = gridSection.content as Record<string, unknown>
    const gCtaButton = gContent.ctaButton as { label: string; href: string } | undefined
    let updated = false

    const updates: Record<string, unknown> = { ...gContent }
    if (gContent.showCtaIcon !== false) {
      updates.showCtaIcon = false
      updated = true
    }
    if (gCtaButton && gCtaButton.href !== '/im-new#plan-visit') {
      updates.ctaButton = { ...gCtaButton, href: '/im-new#plan-visit' }
      updated = true
    }

    if (updated) {
      await prisma.pageSection.update({
        where: { id: gridSection.id },
        data: { content: updates },
      })
      console.log('  ✓ Updated college CAMPUS_CARD_GRID (href + showCtaIcon)')
    } else {
      console.log('  ✓ College CAMPUS_CARD_GRID already correct')
    }
  }
}

// ============================================================
// 14. Set showCtaIcon: true on I'm New page CAMPUS_CARD_GRID
// ============================================================
console.log('\n── 14. Setting showCtaIcon: true on I\'m New CAMPUS_CARD_GRID ──')

const imNewPageForGrid = await prisma.page.findFirst({
  where: { churchId, slug: 'im-new' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!imNewPageForGrid) {
  console.warn('  ⚠ I\'m New page not found — skipping')
} else {
  const gridSection = imNewPageForGrid.sections.find(s => s.sectionType === 'CAMPUS_CARD_GRID')
  if (!gridSection) {
    console.warn('  ⚠ CAMPUS_CARD_GRID not found on I\'m New page — skipping')
  } else {
    const gContent = gridSection.content as Record<string, unknown>
    if (gContent.showCtaIcon === true) {
      console.log('  ✓ showCtaIcon already true')
    } else {
      await prisma.pageSection.update({
        where: { id: gridSection.id },
        data: { content: { ...gContent, showCtaIcon: true } },
      })
      console.log('  ✓ Set showCtaIcon: true on I\'m New CAMPUS_CARD_GRID')
    }
  }
}

// ============================================================
// 15. Replace Sunday Worship image in Next Steps with sunday-praise.webp
// ============================================================
console.log('\n── 15. Replacing Sunday Worship image in Next Steps ──')

const CDN = 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/initial-setup'
const oldSundayImg = `${CDN}/images-home-compressed-sunday-worship.jpg`
const newSundayImg = `${CDN}/sunday-praise.webp`

const homePageForImg = await prisma.page.findFirst({
  where: { churchId, isHomepage: true },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!homePageForImg) {
  console.warn('  ⚠ Home page not found — skipping')
} else {
  const actionGrid = homePageForImg.sections.find(s => s.sectionType === 'ACTION_CARD_GRID')
  if (!actionGrid) {
    console.warn('  ⚠ ACTION_CARD_GRID not found on home page — skipping')
  } else {
    const agContent = actionGrid.content as Record<string, unknown>
    const cards = agContent.cards as Array<{ id: string; imageUrl: string; [k: string]: unknown }> | undefined

    if (!cards) {
      console.warn('  ⚠ No cards found in ACTION_CARD_GRID — skipping')
    } else {
      const sundayCard = cards.find(c => c.id === 'ns-1' || c.imageUrl === oldSundayImg)
      if (!sundayCard) {
        console.log('  ⚠ Sunday Worship card not found — skipping')
      } else if (sundayCard.imageUrl === newSundayImg) {
        console.log('  ✓ Sunday Worship image already updated')
      } else {
        const updatedCards = cards.map(c => {
          if (c === sundayCard) return { ...c, imageUrl: newSundayImg }
          return c
        })
        await prisma.pageSection.update({
          where: { id: actionGrid.id },
          data: { content: { ...agContent, cards: updatedCards } },
        })
        console.log(`  ✓ Updated Sunday Worship image to sunday-praise.webp`)
      }
    }
  }
}

// Also ensure the media library has this asset
const existingMedia = await prisma.mediaAsset.findFirst({
  where: { churchId, filename: 'sunday-praise.webp', deletedAt: null },
})
if (existingMedia) {
  console.log('  ✓ sunday-praise.webp already in media library')
} else {
  await prisma.mediaAsset.create({
    data: {
      churchId,
      filename: 'sunday-praise.webp',
      url: newSundayImg,
      mimeType: 'image/webp',
      fileSize: 56854,
      folder: 'initial-setup',
    },
  })
  console.log('  ✓ Added sunday-praise.webp to media library')
}

// ============================================================
// Done
// ============================================================
console.log('\n✅ All website fixes applied.')
await prisma.$disconnect()
await pool.end()
