# LA UBF Website Data Backup

This directory contains a JSON backup of all LA UBF website builder seed data. It serves as the canonical reference for the website's structure, content, and configuration so it can always be restored to a known-good state.

## What's Included

**File:** `laubf-website-data.json`

| Section | Description | Count |
|---|---|---|
| `siteSettings` | Site name, tagline, contact info, social links, service times, feature flags | 1 object |
| `theme` | Base theme (`Modern Church`) with default design tokens | 1 object |
| `themeCustomization` | LA UBF brand overrides: colors, fonts, custom font files, Google Fonts | 1 object |
| `menus` | Header (Main Navigation) and Footer navigation with all items | 2 menus |
| `pages` | All 14 website pages with their section configurations | 14 pages, 66 sections total |

### Pages in the Backup

| # | Slug | Title | Sections |
|---|---|---|---|
| 1 | `` (empty) | Home | 10 |
| 2 | `about` | About | 5 |
| 3 | `messages` | Messages | 2 |
| 4 | `events` | Events | 2 |
| 5 | `bible-study` | Bible Study | 2 |
| 6 | `videos` | Videos | 2 |
| 7 | `daily-bread` | Daily Bread | 1 |
| 8 | `ministries` | Ministries | 4 |
| 9 | `ministries/college` | College Ministry | 8 |
| 10 | `ministries/adults` | Adults Ministry | 6 |
| 11 | `ministries/high-school` | High School Ministry | 7 |
| 12 | `ministries/children` | Children's Ministry | 7 |
| 13 | `im-new` | I'm New | 8 |
| 14 | `giving` | Giving | 2 |

## What's NOT Included

This backup only covers **website builder** data. The following content types are seeded separately by `prisma/seed.mts` and are not part of this backup:

- Messages (sermons)
- Bible studies
- Events
- Videos
- Daily breads
- Speakers, series, ministries, campuses
- Church record
- User accounts

## How to Restore

### Option 1: Re-run the full seed (recommended)

The seed script (`prisma/seed.mts`) is idempotent -- it clears and recreates all data. Running it restores everything including the website data from this backup:

```bash
npx prisma db seed
```

### Option 2: Manual restore via Prisma Studio

If you only need to inspect or verify the data:

1. Open Prisma Studio: `npx prisma studio`
2. Compare current database records against the JSON backup
3. Manually update any records that have drifted

### Option 3: Programmatic restore from JSON

To write a restore script that reads this JSON and upserts records:

```typescript
import backupData from './prisma/backups/laubf-website-data.json';

// 1. Look up churchId
const church = await prisma.church.findUnique({ where: { slug: 'la-ubf' } });
const churchId = church.id;

// 2. Upsert SiteSettings
await prisma.siteSettings.upsert({
  where: { churchId },
  update: backupData.siteSettings,
  create: { churchId, ...backupData.siteSettings },
});

// 3. Upsert Theme
const theme = await prisma.theme.upsert({
  where: { slug: backupData.theme.slug },
  update: backupData.theme,
  create: backupData.theme,
});

// 4. Upsert ThemeCustomization
await prisma.themeCustomization.upsert({
  where: { churchId_themeId: { churchId, themeId: theme.id } },
  update: backupData.themeCustomization,
  create: { churchId, themeId: theme.id, ...backupData.themeCustomization },
});

// 5. Recreate Menus (delete + create to handle menu items)
await prisma.menuItem.deleteMany({ where: { menu: { churchId } } });
await prisma.menu.deleteMany({ where: { churchId } });
for (const menuData of backupData.menus) {
  const menu = await prisma.menu.create({
    data: { churchId, name: menuData.name, slug: menuData.slug, location: menuData.location },
  });
  // Create items (handle parent-child relationships)
  for (const item of menuData.items) {
    if (item.children) {
      const parent = await prisma.menuItem.create({
        data: { menuId: menu.id, label: item.label, href: item.href, sortOrder: item.sortOrder, groupLabel: item.groupLabel },
      });
      for (const child of item.children) {
        await prisma.menuItem.create({
          data: { menuId: menu.id, parentId: parent.id, ...child },
        });
      }
    } else {
      await prisma.menuItem.create({
        data: { menuId: menu.id, ...item },
      });
    }
  }
}

// 6. Recreate Pages + Sections
await prisma.pageSection.deleteMany({ where: { churchId } });
await prisma.page.deleteMany({ where: { churchId } });
for (const pageData of backupData.pages) {
  const { sections, parentSlug, ...pageFields } = pageData;
  const page = await prisma.page.create({
    data: {
      churchId,
      ...pageFields,
      isPublished: true,
      publishedAt: new Date(),
      pageType: pageFields.pageType || 'STANDARD',
    },
  });
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    await prisma.pageSection.create({
      data: {
        churchId,
        pageId: page.id,
        sectionType: s.sectionType,
        label: s.label,
        sortOrder: i,
        colorScheme: s.colorScheme || 'LIGHT',
        paddingY: s.paddingY || 'DEFAULT',
        containerWidth: s.containerWidth || 'STANDARD',
        content: s.content,
      },
    });
  }
}
```

## Keeping the Backup Current

When the seed data changes in `prisma/seed.mts` (sections 11a-11e), update this JSON backup to match. The backup should always reflect the current state of the seed script's website builder data.

Key sections in `seed.mts` that map to this backup:
- **11a** (line ~542): Theme
- **11b** (line ~564): ThemeCustomization
- **11c** (line ~619): SiteSettings
- **11d** (line ~650): Menus + MenuItems
- **11e** (line ~1005): Pages + PageSections
