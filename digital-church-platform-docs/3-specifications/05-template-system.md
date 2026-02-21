# Multi-Template Design System

## Document Information
| Field | Value |
|-------|-------|
| Document ID | 08 |
| Document Title | Multi-Template Design System |
| Version | 3.0 Enterprise Edition |
| Last Updated | December 2024 |
| Dependencies | 02-database-schema.md, 07-church-admin-cms.md |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Template Architecture](#2-template-architecture)
3. [Template Configuration Schema](#3-template-configuration-schema)
4. [Template Provider System](#4-template-provider-system)
5. [Theme System](#5-theme-system)
6. [Section Variants](#6-section-variants)
7. [Template-Specific Components](#7-template-specific-components)
8. [Template Management](#8-template-management)
9. [Theme Customizer](#9-theme-customizer)
10. [Template Marketplace](#10-template-marketplace)
11. [Version Control](#11-version-control)
12. [Best Practices](#12-best-practices)

---

## 1. Overview

### Purpose
The Multi-Template Design System enables churches to establish their unique visual identity while maintaining consistent functionality across the platform. Each church can select from professionally designed templates and customize them to match their brand.

### Key Features
- **Multiple Professional Templates**: Pre-built designs optimized for church websites
- **Per-Tenant Customization**: Each church maintains independent theme settings
- **Section Variants**: Multiple display options for each content section
- **Theme Builder**: Visual customization without code
- **Version Control**: Track and rollback customization changes
- **Template Inheritance**: Extend base templates with custom overrides

### Competitive Advantage

| Feature | Tithely | Pushpay | Subsplash | **Digital Church Platform** |
|---------|---------|---------|-----------|----------------------------|
| Template Count | 3-5 Basic | Limited | 10+ | **20+ Professional** |
| Customization Depth | Colors Only | Limited | Good | **Full Theme Builder** |
| Section Variants | None | None | Some | **3-5 Per Section** |
| Custom CSS | No | No | Limited | **Full Support** |
| Version Control | No | No | No | **Full History** |
| A/B Testing | No | No | No | **Template Testing** |

---

## 2. Template Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Multi-Template Architecture                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      Template Resolution Layer                           ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ││
│  │  │   Tenant    │ │  Template   │ │    CSS      │ │  Component  │       ││
│  │  │   Context   │ │   Config    │ │  Variables  │ │  Registry   │       ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     Template Component Loading                           ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  templates/{templateId}/components/ → Shared → Default Fallback     │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│                                    ▼                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │  Header   │ │  Footer   │ │  Sections │ │   Cards   │ │   Forms   │     │
│  │ Variants  │ │ Variants  │ │ (20+ Types)│ │ Variants  │ │ Variants  │     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
templates/
├── _shared/                     # Shared components across all templates
│   ├── components/
│   │   ├── Header/
│   │   │   ├── index.tsx
│   │   │   └── variants/
│   │   │       ├── centered.tsx
│   │   │       ├── split.tsx
│   │   │       └── minimal.tsx
│   │   ├── Footer/
│   │   ├── sections/
│   │   └── cards/
│   └── styles/
│       └── base.css
│
├── modern-church/               # Template: Modern Church
│   ├── config.json              # Template configuration
│   ├── preview.png              # Template preview image
│   ├── components/
│   │   ├── Header/
│   │   ├── Footer/
│   │   └── sections/
│   │       ├── hero_image.tsx
│   │       ├── sermons_list.tsx
│   │       └── events_grid.tsx
│   └── styles/
│       └── theme.css
│
├── classic-traditional/         # Template: Classic Traditional
│   ├── config.json
│   ├── preview.png
│   └── components/
│
├── minimalist-clean/            # Template: Minimalist Clean
│   ├── config.json
│   ├── preview.png
│   └── components/
│
├── vibrant-community/           # Template: Vibrant Community
│   ├── config.json
│   ├── preview.png
│   └── components/
│
└── chicago-ubf/                 # Template: Chicago UBF (Default)
    ├── config.json
    ├── preview.png
    └── components/
```

### Template Loading Strategy

```typescript
// lib/template/loader.ts
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export interface TemplateConfig {
  templateId: string;
  templateName: string;
  version: string;
  theme: ThemeConfig;
  layouts: LayoutConfig;
  sections: Record<string, SectionConfig>;
  components: Record<string, ComponentConfig>;
  features: FeatureFlags;
}

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono?: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: {
    section: string;
    container: string;
  };
}

interface LayoutConfig {
  header: 'default' | 'centered' | 'split' | 'minimal' | 'transparent';
  footer: 'default' | 'minimal' | 'expanded' | 'centered';
  sidebar?: 'left' | 'right' | 'none';
  containerWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface SectionConfig {
  variant: string;
  defaultVariant: string;
  availableVariants: string[];
  settings?: Record<string, any>;
}

// Cached template config loader
export const getTemplateConfig = cache(async (tenantId: string): Promise<TemplateConfig> => {
  // Get tenant's template and customizations
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      templateCustomization: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Load base template config
  const baseConfig = await loadBaseTemplateConfig(tenant.templateId || 'modern-church');

  // Apply tenant customizations
  const customizations = tenant.templateCustomization?.customizations as any || {};

  return mergeTemplateConfig(baseConfig, customizations);
});

async function loadBaseTemplateConfig(templateId: string): Promise<TemplateConfig> {
  try {
    // Dynamic import of template config
    const config = await import(`@/templates/${templateId}/config.json`);
    return config.default;
  } catch {
    // Fallback to default template
    const defaultConfig = await import('@/templates/modern-church/config.json');
    return defaultConfig.default;
  }
}

function mergeTemplateConfig(
  base: TemplateConfig,
  customizations: Partial<TemplateConfig>
): TemplateConfig {
  return {
    ...base,
    theme: {
      ...base.theme,
      colors: { ...base.theme.colors, ...customizations.theme?.colors },
      fonts: { ...base.theme.fonts, ...customizations.theme?.fonts },
      borderRadius: customizations.theme?.borderRadius || base.theme.borderRadius,
      shadows: { ...base.theme.shadows, ...customizations.theme?.shadows },
      spacing: { ...base.theme.spacing, ...customizations.theme?.spacing },
    },
    layouts: { ...base.layouts, ...customizations.layouts },
    sections: { ...base.sections, ...customizations.sections },
    components: { ...base.components, ...customizations.components },
  };
}
```

---

## 3. Template Configuration Schema

### Base Template Config

```json
// templates/modern-church/config.json
{
  "templateId": "modern-church",
  "templateName": "Modern Church",
  "version": "1.2.0",
  "description": "A contemporary, clean design perfect for growing churches",
  "author": "Digital Church Platform",
  "category": "modern",
  "tags": ["clean", "modern", "responsive", "video-ready"],
  "preview": "/templates/modern-church/preview.png",
  "screenshots": [
    "/templates/modern-church/screenshots/home.png",
    "/templates/modern-church/screenshots/sermons.png",
    "/templates/modern-church/screenshots/events.png"
  ],

  "theme": {
    "colors": {
      "primary": "#0ea5e9",
      "secondary": "#1e293b",
      "accent": "#f97316",
      "background": "#ffffff",
      "foreground": "#0f172a",
      "muted": "#f1f5f9",
      "mutedForeground": "#64748b",
      "border": "#e2e8f0",
      "error": "#ef4444",
      "success": "#22c55e",
      "warning": "#f59e0b"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "borderRadius": "0.5rem",
    "shadows": {
      "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)"
    },
    "spacing": {
      "section": "4rem",
      "container": "1280px"
    }
  },

  "layouts": {
    "header": "default",
    "footer": "expanded",
    "containerWidth": "lg"
  },

  "sections": {
    "hero_image": {
      "defaultVariant": "full-width",
      "availableVariants": ["full-width", "split", "overlay", "video"],
      "settings": {
        "height": "80vh",
        "minHeight": "500px",
        "maxHeight": "900px",
        "overlayOpacity": 0.4,
        "showArrows": true,
        "showDots": true,
        "autoplay": true,
        "autoplayInterval": 5000
      }
    },
    "sermons_list": {
      "defaultVariant": "grid",
      "availableVariants": ["grid", "list", "carousel", "featured"],
      "settings": {
        "columns": 3,
        "limit": 6,
        "showFilters": true
      }
    },
    "events_grid": {
      "defaultVariant": "grid",
      "availableVariants": ["grid", "list", "calendar", "timeline"],
      "settings": {
        "columns": 3,
        "limit": 6,
        "showPastEvents": false
      }
    },
    "welcome_with_image": {
      "defaultVariant": "image-right",
      "availableVariants": ["image-right", "image-left", "image-background"],
      "settings": {
        "showButton": true
      }
    },
    "ministries_grid": {
      "defaultVariant": "card",
      "availableVariants": ["card", "list", "icon-grid"],
      "settings": {
        "columns": 3
      }
    },
    "contact_form": {
      "defaultVariant": "split",
      "availableVariants": ["split", "centered", "full-width"],
      "settings": {
        "showMap": true
      }
    },
    "giving_section": {
      "defaultVariant": "default",
      "availableVariants": ["default", "compact", "detailed"],
      "settings": {
        "showProgressBars": true
      }
    },
    "testimonials": {
      "defaultVariant": "carousel",
      "availableVariants": ["carousel", "grid", "masonry"],
      "settings": {
        "autoplay": true
      }
    }
  },

  "components": {
    "header": {
      "showSearch": true,
      "showGiveButton": true,
      "showLoginButton": true,
      "stickyHeader": true,
      "ctaText": "Give",
      "ctaUrl": "/give"
    },
    "footer": {
      "showNewsletter": true,
      "showSocialLinks": true,
      "showServiceTimes": true,
      "columns": 4
    },
    "sermonCard": {
      "showThumbnail": true,
      "showSpeaker": true,
      "showScripture": true,
      "showDuration": true
    },
    "eventCard": {
      "showImage": true,
      "showLocation": true,
      "showRegistration": true
    }
  },

  "features": {
    "darkMode": false,
    "rtlSupport": false,
    "multiLanguage": false,
    "animations": true,
    "lazyLoading": true
  },

  "requiredPlan": "starter",
  "isDefault": false,
  "isActive": true
}
```

### Database Schema for Template Customization

```prisma
// prisma/schema.prisma

model Template {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  version     String
  category    String   // modern, traditional, minimalist, vibrant
  tags        String[] // searchable tags

  previewUrl     String?
  screenshots    String[] // Array of screenshot URLs

  baseConfig     Json     // Default template configuration
  features       Json     // Feature flags
  requiredPlan   String   @default("starter")

  isActive       Boolean  @default(true)
  isDefault      Boolean  @default(false)
  isFeatured     Boolean  @default(false)

  // Metrics
  usageCount     Int      @default(0)
  rating         Float    @default(0)
  reviewCount    Int      @default(0)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  tenants        Tenant[]
  customizations TemplateCustomization[]
  versions       TemplateVersion[]

  @@index([category])
  @@index([isActive, isFeatured])
}

model TemplateCustomization {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  templateId      String

  // Customization data
  customizations  Json     // Theme overrides, section configs
  customCss       String?  // Custom CSS code
  customScripts   String?  // Custom JavaScript (limited)

  // Version tracking
  version         Int      @default(1)
  publishedAt     DateTime?

  // Draft support
  draftCustomizations Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  template        Template @relation(fields: [templateId], references: [id])
  history         TemplateCustomizationHistory[]

  @@index([tenantId])
  @@index([templateId])
}

model TemplateCustomizationHistory {
  id              String   @id @default(cuid())
  customizationId String

  version         Int
  customizations  Json
  customCss       String?

  changedBy       String?  // User ID
  changeNote      String?

  createdAt       DateTime @default(now())

  // Relations
  customization   TemplateCustomization @relation(fields: [customizationId], references: [id], onDelete: Cascade)

  @@index([customizationId, version])
}

model TemplateVersion {
  id          String   @id @default(cuid())
  templateId  String

  version     String   // semver: 1.0.0
  changelog   String?
  config      Json     // Snapshot of config at this version

  isLatest    Boolean  @default(false)
  releasedAt  DateTime @default(now())

  // Relations
  template    Template @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@unique([templateId, version])
  @@index([templateId, isLatest])
}
```

---

## 4. Template Provider System

### Template Context Provider

```typescript
// contexts/TemplateContext.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import type { TemplateConfig, ThemeConfig, SectionConfig } from '@/lib/template/types';

interface TemplateContextValue {
  templateId: string;
  config: TemplateConfig;
  theme: ThemeConfig;

  // Helpers
  getComponentConfig: (componentName: string) => Record<string, any>;
  getSectionConfig: (sectionType: string) => SectionConfig;
  getSectionVariant: (sectionType: string) => string;

  // Theme helpers
  getPrimaryColor: () => string;
  getSecondaryColor: () => string;
  getFontFamily: (type: 'heading' | 'body') => string;
  getBorderRadius: () => string;

  // CSS Variable generation
  getCssVariables: () => Record<string, string>;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

interface TemplateProviderProps {
  children: ReactNode;
  templateConfig: TemplateConfig;
}

export function TemplateProvider({
  children,
  templateConfig,
}: TemplateProviderProps) {
  // Inject CSS variables on mount and config changes
  useEffect(() => {
    const root = document.documentElement;
    const { colors, fonts, borderRadius, shadows, spacing } = templateConfig.theme;

    // Set color variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--template-${kebabCase(key)}`, value);
    });

    // Set font variables
    if (fonts.heading) {
      root.style.setProperty('--template-font-heading', `'${fonts.heading}', serif`);
    }
    if (fonts.body) {
      root.style.setProperty('--template-font-body', `'${fonts.body}', sans-serif`);
    }
    if (fonts.mono) {
      root.style.setProperty('--template-font-mono', `'${fonts.mono}', monospace`);
    }

    // Set other variables
    root.style.setProperty('--template-border-radius', borderRadius);

    // Set shadow variables
    Object.entries(shadows).forEach(([key, value]) => {
      root.style.setProperty(`--template-shadow-${key}`, value);
    });

    // Set spacing variables
    root.style.setProperty('--template-section-spacing', spacing.section);
    root.style.setProperty('--template-container-width', spacing.container);

    return () => {
      // Cleanup on unmount
      const allVars = [
        ...Object.keys(colors).map(k => `--template-${kebabCase(k)}`),
        '--template-font-heading',
        '--template-font-body',
        '--template-font-mono',
        '--template-border-radius',
        ...Object.keys(shadows).map(k => `--template-shadow-${k}`),
        '--template-section-spacing',
        '--template-container-width',
      ];

      allVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
    };
  }, [templateConfig]);

  const getComponentConfig = useCallback((componentName: string) => {
    return templateConfig.components?.[componentName] || {};
  }, [templateConfig.components]);

  const getSectionConfig = useCallback((sectionType: string): SectionConfig => {
    return templateConfig.sections?.[sectionType] || {
      variant: 'default',
      defaultVariant: 'default',
      availableVariants: ['default'],
    };
  }, [templateConfig.sections]);

  const getSectionVariant = useCallback((sectionType: string): string => {
    const config = getSectionConfig(sectionType);
    return config.variant || config.defaultVariant || 'default';
  }, [getSectionConfig]);

  const getPrimaryColor = useCallback(() => {
    return templateConfig.theme.colors.primary;
  }, [templateConfig.theme.colors.primary]);

  const getSecondaryColor = useCallback(() => {
    return templateConfig.theme.colors.secondary;
  }, [templateConfig.theme.colors.secondary]);

  const getFontFamily = useCallback((type: 'heading' | 'body') => {
    return templateConfig.theme.fonts[type] || 'Inter';
  }, [templateConfig.theme.fonts]);

  const getBorderRadius = useCallback(() => {
    return templateConfig.theme.borderRadius;
  }, [templateConfig.theme.borderRadius]);

  const getCssVariables = useCallback(() => {
    const { colors, fonts, borderRadius, shadows, spacing } = templateConfig.theme;
    const vars: Record<string, string> = {};

    Object.entries(colors).forEach(([key, value]) => {
      vars[`--template-${kebabCase(key)}`] = value;
    });

    vars['--template-font-heading'] = `'${fonts.heading}', serif`;
    vars['--template-font-body'] = `'${fonts.body}', sans-serif`;
    vars['--template-border-radius'] = borderRadius;

    Object.entries(shadows).forEach(([key, value]) => {
      vars[`--template-shadow-${key}`] = value;
    });

    vars['--template-section-spacing'] = spacing.section;
    vars['--template-container-width'] = spacing.container;

    return vars;
  }, [templateConfig.theme]);

  const value = useMemo<TemplateContextValue>(() => ({
    templateId: templateConfig.templateId,
    config: templateConfig,
    theme: templateConfig.theme,
    getComponentConfig,
    getSectionConfig,
    getSectionVariant,
    getPrimaryColor,
    getSecondaryColor,
    getFontFamily,
    getBorderRadius,
    getCssVariables,
  }), [
    templateConfig,
    getComponentConfig,
    getSectionConfig,
    getSectionVariant,
    getPrimaryColor,
    getSecondaryColor,
    getFontFamily,
    getBorderRadius,
    getCssVariables,
  ]);

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}

// Utility function
function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
```

### Server-Side Template Loading

```typescript
// lib/template/server.ts
import { cache } from 'react';
import { headers } from 'next/headers';
import { getTemplateConfig } from './loader';

// Cached server-side template loading
export const getServerTemplateConfig = cache(async () => {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');

  if (!tenantId) {
    throw new Error('Tenant ID not found in headers');
  }

  return getTemplateConfig(tenantId);
});

// Generate inline CSS for SSR
export async function generateTemplateCss(tenantId: string): Promise<string> {
  const config = await getTemplateConfig(tenantId);
  const { colors, fonts, borderRadius, shadows, spacing } = config.theme;

  const cssVars = Object.entries(colors)
    .map(([key, value]) => `--template-${kebabCase(key)}: ${value};`)
    .join('\n');

  return `
    :root {
      ${cssVars}
      --template-font-heading: '${fonts.heading}', serif;
      --template-font-body: '${fonts.body}', sans-serif;
      --template-border-radius: ${borderRadius};
      --template-shadow-sm: ${shadows.sm};
      --template-shadow-md: ${shadows.md};
      --template-shadow-lg: ${shadows.lg};
      --template-section-spacing: ${spacing.section};
      --template-container-width: ${spacing.container};
    }
  `;
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
```

### Public Layout with Template Integration

```typescript
// app/(public)/layout.tsx
import { headers } from 'next/headers';
import { getTenantFromHeaders } from '@/lib/tenant/context';
import { getTemplateConfig, generateTemplateCss } from '@/lib/template/server';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { TemplateHeader } from '@/components/template/TemplateHeader';
import { TemplateFooter } from '@/components/template/TemplateFooter';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantFromHeaders();

  if (!tenant) {
    return <div>Church not found</div>;
  }

  const templateConfig = await getTemplateConfig(tenant.id);
  const templateCss = await generateTemplateCss(tenant.id);

  return (
    <TemplateProvider templateConfig={templateConfig}>
      {/* Inline Template CSS Variables */}
      <style dangerouslySetInnerHTML={{ __html: templateCss }} />

      {/* Google Fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          templateConfig.theme.fonts.heading
        )}:wght@400;500;600;700&family=${encodeURIComponent(
          templateConfig.theme.fonts.body
        )}:wght@400;500;600&display=swap`}
        rel="stylesheet"
      />

      <div className="min-h-screen flex flex-col">
        <TemplateHeader templateId={templateConfig.templateId} />
        <main className="flex-1" style={{ fontFamily: 'var(--template-font-body)' }}>
          {children}
        </main>
        <TemplateFooter templateId={templateConfig.templateId} />
      </div>
    </TemplateProvider>
  );
}
```

---

## 5. Theme System

### CSS Variables System

```css
/* styles/template-base.css */

:root {
  /* Color Palette - Overridden by template */
  --template-primary: #0ea5e9;
  --template-secondary: #1e293b;
  --template-accent: #f97316;
  --template-background: #ffffff;
  --template-foreground: #0f172a;
  --template-muted: #f1f5f9;
  --template-muted-foreground: #64748b;
  --template-border: #e2e8f0;
  --template-error: #ef4444;
  --template-success: #22c55e;
  --template-warning: #f59e0b;

  /* Typography */
  --template-font-heading: 'Inter', sans-serif;
  --template-font-body: 'Inter', sans-serif;
  --template-font-mono: 'JetBrains Mono', monospace;

  /* Border Radius */
  --template-border-radius: 0.5rem;
  --template-border-radius-sm: 0.25rem;
  --template-border-radius-lg: 0.75rem;
  --template-border-radius-full: 9999px;

  /* Shadows */
  --template-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --template-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --template-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --template-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Spacing */
  --template-section-spacing: 4rem;
  --template-container-width: 1280px;

  /* Transitions */
  --template-transition-fast: 150ms ease;
  --template-transition-normal: 200ms ease;
  --template-transition-slow: 300ms ease;
}

/* Template-aware utility classes */
.template-primary {
  color: var(--template-primary);
}

.template-bg-primary {
  background-color: var(--template-primary);
}

.template-border-primary {
  border-color: var(--template-primary);
}

.template-heading {
  font-family: var(--template-font-heading);
}

.template-body {
  font-family: var(--template-font-body);
}

.template-rounded {
  border-radius: var(--template-border-radius);
}

.template-shadow {
  box-shadow: var(--template-shadow-md);
}

.template-section {
  padding-top: var(--template-section-spacing);
  padding-bottom: var(--template-section-spacing);
}

.template-container {
  max-width: var(--template-container-width);
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}
```

### Theme-Aware Component Styling

```typescript
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--template-primary)] text-white hover:opacity-90',
        destructive: 'bg-[var(--template-error)] text-white hover:opacity-90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-[var(--template-secondary)] text-white hover:opacity-90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-[var(--template-primary)] underline-offset-4 hover:underline',
        accent: 'bg-[var(--template-accent)] text-white hover:opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        xl: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          borderRadius: 'var(--template-border-radius)',
          ...style,
        }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Theme-Aware Card Component

```typescript
// components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border bg-card text-card-foreground',
      className
    )}
    style={{
      borderRadius: 'var(--template-border-radius)',
      borderColor: 'var(--template-border)',
      boxShadow: 'var(--template-shadow-sm)',
      ...style,
    }}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, style, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    style={{
      fontFamily: 'var(--template-font-heading)',
      color: 'var(--template-foreground)',
      ...style,
    }}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm', className)}
    style={{
      fontFamily: 'var(--template-font-body)',
      color: 'var(--template-muted-foreground)',
    }}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
```

---

## 6. Section Variants

### Section Renderer Component

```typescript
// components/template/SectionRenderer.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useTemplate } from '@/contexts/TemplateContext';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface HomepageSection {
  id: string;
  type: string;
  order: number;
  data: Record<string, any>;
  settings?: Record<string, any>;
}

interface SectionRendererProps {
  section: HomepageSection;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const { templateId, getSectionConfig } = useTemplate();
  const sectionConfig = getSectionConfig(section.type);

  // Get variant from section settings or fall back to template default
  const variant = section.settings?.variant || sectionConfig.variant || sectionConfig.defaultVariant || 'default';

  // Dynamic import with fallback chain:
  // 1. Template-specific section
  // 2. Shared section
  // 3. Default section
  const SectionComponent = dynamic(
    () =>
      import(`@/templates/${templateId}/sections/${section.type}`)
        .catch(() => import(`@/templates/_shared/sections/${section.type}`))
        .catch(() => import(`@/components/sections/defaults/${section.type}`))
        .catch(() => ({
          default: () => (
            <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">
                Section type "{section.type}" not found for template "{templateId}"
              </p>
            </div>
          ),
        })),
    {
      loading: () => <SectionSkeleton type={section.type} />,
      ssr: true,
    }
  );

  return (
    <section
      id={`section-${section.id}`}
      className="relative"
      style={{
        backgroundColor: section.settings?.backgroundColor || 'transparent',
        paddingTop: section.settings?.paddingTop || 'var(--template-section-spacing)',
        paddingBottom: section.settings?.paddingBottom || 'var(--template-section-spacing)',
      }}
    >
      <Suspense fallback={<SectionSkeleton type={section.type} />}>
        <SectionComponent
          data={section.data}
          settings={{
            ...sectionConfig.settings,
            ...section.settings,
          }}
          variant={variant}
        />
      </Suspense>
    </section>
  );
}

function SectionSkeleton({ type }: { type: string }) {
  switch (type) {
    case 'hero_image':
      return <div className="h-[80vh] bg-gray-200 animate-pulse" />;
    case 'sermons_list':
    case 'events_grid':
    case 'ministries_grid':
      return (
        <div className="container mx-auto py-16">
          <div className="h-10 w-64 bg-gray-200 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="container mx-auto py-16">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      );
  }
}
```

### Hero Section with Multiple Variants

```typescript
// templates/_shared/sections/hero_image.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: string;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

interface HeroImageProps {
  data: {
    slides: HeroSlide[];
  };
  settings: {
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    overlayOpacity?: number;
    showArrows?: boolean;
    showDots?: boolean;
    autoplay?: boolean;
    autoplayInterval?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
  variant: 'full-width' | 'split' | 'overlay' | 'video';
}

export default function HeroImage({ data, settings, variant }: HeroImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = data.slides || [];

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (!settings.autoplay || slides.length <= 1) return;
    const timer = setInterval(nextSlide, settings.autoplayInterval || 5000);
    return () => clearInterval(timer);
  }, [settings.autoplay, settings.autoplayInterval, slides.length, nextSlide]);

  if (slides.length === 0) return null;

  // Split variant
  if (variant === 'split') {
    const slide = slides[currentIndex];
    return (
      <section className="grid md:grid-cols-2 min-h-[60vh]">
        <div
          className="flex items-center justify-center p-12"
          style={{
            background: 'linear-gradient(135deg, var(--template-primary), var(--template-secondary))',
          }}
        >
          <div className="max-w-lg text-white">
            {slide.title && (
              <h1
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ fontFamily: 'var(--template-font-heading)' }}
              >
                {slide.title}
              </h1>
            )}
            {slide.subtitle && (
              <p className="text-xl mb-8 opacity-90">{slide.subtitle}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {slide.buttonText && slide.buttonLink && (
                <Button size="lg" variant="secondary" asChild>
                  <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                </Button>
              )}
              {slide.secondaryButtonText && slide.secondaryButtonLink && (
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white" asChild>
                  <Link href={slide.secondaryButtonLink}>{slide.secondaryButtonText}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="relative min-h-[300px] md:min-h-0">
          <Image
            src={slide.image}
            alt={slide.title || 'Hero image'}
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>
    );
  }

  // Video variant
  if (variant === 'video') {
    const slide = slides[currentIndex];
    return (
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: settings.height || '80vh',
          minHeight: settings.minHeight || '500px',
          maxHeight: settings.maxHeight || '900px',
        }}
      >
        {/* Video Background Placeholder */}
        <div className="absolute inset-0 bg-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: settings.overlayOpacity ?? 0.5 }}
        />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          {slide.title && (
            <h1
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: 'var(--template-font-heading)' }}
            >
              {slide.title}
            </h1>
          )}
          {slide.subtitle && (
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
              {slide.subtitle}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            {slide.buttonText && slide.buttonLink && (
              <Button size="lg" asChild>
                <Link href={slide.buttonLink}>
                  <Play className="mr-2 h-5 w-5" />
                  {slide.buttonText}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default: full-width / overlay variant
  return (
    <section
      className="relative overflow-hidden"
      style={{
        height: settings.height || '80vh',
        minHeight: settings.minHeight || '500px',
        maxHeight: settings.maxHeight || '900px',
      }}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {/* Desktop Image */}
          <Image
            src={slide.image}
            alt={slide.title || ''}
            fill
            className="object-cover hidden md:block"
            priority={index === 0}
          />

          {/* Mobile Image */}
          <Image
            src={slide.mobileImage || slide.image}
            alt={slide.title || ''}
            fill
            className="object-cover md:hidden"
            priority={index === 0}
          />

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"
            style={{ opacity: settings.overlayOpacity ?? 0.6 }}
          />

          {/* Content */}
          <div
            className={cn(
              'absolute inset-0 flex items-center',
              settings.textAlign === 'center' && 'justify-center text-center',
              settings.textAlign === 'right' && 'justify-end text-right'
            )}
          >
            <div className="container mx-auto px-6 md:px-12">
              <div className={cn(
                'max-w-2xl text-white',
                settings.textAlign === 'center' && 'mx-auto',
                settings.textAlign === 'right' && 'ml-auto'
              )}>
                {slide.title && (
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
                    style={{ fontFamily: 'var(--template-font-heading)' }}
                  >
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="text-lg md:text-xl mb-8 opacity-90">
                    {slide.subtitle}
                  </p>
                )}
                <div className={cn(
                  'flex flex-wrap gap-4',
                  settings.textAlign === 'center' && 'justify-center',
                  settings.textAlign === 'right' && 'justify-end'
                )}>
                  {slide.buttonText && slide.buttonLink && (
                    <Button size="lg" asChild>
                      <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                    </Button>
                  )}
                  {slide.secondaryButtonText && slide.secondaryButtonLink && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent text-white border-white hover:bg-white hover:text-black"
                      asChild
                    >
                      <Link href={slide.secondaryButtonLink}>{slide.secondaryButtonText}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {settings.showArrows !== false && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {settings.showDots !== false && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-3 rounded-full transition-all',
                index === currentIndex
                  ? 'w-8'
                  : 'w-3 bg-white/50 hover:bg-white/75'
              )}
              style={{
                backgroundColor: index === currentIndex ? 'var(--template-primary)' : undefined,
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

### Sermons List Section with Variants

```typescript
// templates/_shared/sections/sermons_list.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PlayIcon, ClockIcon, BookOpenIcon, UserIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';

interface Sermon {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  scripture?: string;
  thumbnail?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  preachedAt: Date;
  seriesName?: string;
}

interface SermonsListProps {
  data: {
    title?: string;
    subtitle?: string;
    sermons: Sermon[];
    showViewAll?: boolean;
    viewAllUrl?: string;
  };
  settings: {
    columns?: number;
    limit?: number;
    showFilters?: boolean;
    showSpeaker?: boolean;
    showScripture?: boolean;
    showDuration?: boolean;
  };
  variant: 'grid' | 'list' | 'carousel' | 'featured';
}

export default function SermonsList({ data, settings, variant }: SermonsListProps) {
  const columns = settings.columns || 3;
  const limit = settings.limit || 6;
  const sermons = data.sermons.slice(0, limit);

  // Featured variant - one large, rest small
  if (variant === 'featured' && sermons.length > 0) {
    const [featured, ...rest] = sermons;

    return (
      <section className="template-container">
        {data.title && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: 'var(--template-font-heading)' }}
              >
                {data.title}
              </h2>
              {data.subtitle && (
                <p className="text-muted-foreground mt-2">{data.subtitle}</p>
              )}
            </div>
            {data.showViewAll && data.viewAllUrl && (
              <Button variant="ghost" asChild>
                <Link href={data.viewAllUrl}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Featured Sermon */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video">
              {featured.thumbnail ? (
                <Image
                  src={featured.thumbnail}
                  alt={featured.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--template-muted)' }}
                >
                  <PlayIcon className="w-16 h-16 opacity-30" />
                </div>
              )}
              {(featured.audioUrl || featured.videoUrl) && (
                <Link
                  href={`/sermons/${featured.slug}`}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
                    style={{ color: 'var(--template-primary)' }}
                  >
                    <PlayIcon className="w-10 h-10 ml-1" />
                  </div>
                </Link>
              )}
              {featured.duration && (
                <Badge className="absolute bottom-4 right-4 bg-black/70">
                  {Math.floor(featured.duration / 60)}:{String(featured.duration % 60).padStart(2, '0')}
                </Badge>
              )}
            </div>
            <CardHeader>
              <Link href={`/sermons/${featured.slug}`}>
                <h3
                  className="text-2xl font-bold hover:text-primary transition-colors"
                  style={{ fontFamily: 'var(--template-font-heading)' }}
                >
                  {featured.title}
                </h3>
              </Link>
              {featured.scripture && settings.showScripture !== false && (
                <p style={{ color: 'var(--template-primary)' }} className="text-lg">
                  {featured.scripture}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {settings.showSpeaker !== false && (
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    {featured.speaker}
                  </span>
                )}
                <span>{formatDate(featured.preachedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Rest of sermons */}
          <div className="space-y-4">
            {rest.slice(0, 4).map((sermon) => (
              <Card key={sermon.id} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  {sermon.thumbnail && (
                    <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={sermon.thumbnail}
                        alt={sermon.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/sermons/${sermon.slug}`}>
                      <h4 className="font-semibold truncate hover:text-primary transition-colors">
                        {sermon.title}
                      </h4>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {sermon.speaker} • {formatDate(sermon.preachedAt)}
                    </p>
                    {sermon.scripture && settings.showScripture !== false && (
                      <p className="text-sm" style={{ color: 'var(--template-primary)' }}>
                        {sermon.scripture}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <section className="template-container">
        {data.title && (
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--template-font-heading)' }}
            >
              {data.title}
            </h2>
            {data.showViewAll && data.viewAllUrl && (
              <Button variant="ghost" asChild>
                <Link href={data.viewAllUrl}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
        <div className="space-y-4">
          {sermons.map((sermon) => (
            <Card key={sermon.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {sermon.thumbnail && (
                  <div className="relative w-full md:w-48 h-32">
                    <Image
                      src={sermon.thumbnail}
                      alt={sermon.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="flex-1 p-4 flex flex-col justify-center">
                  <Link href={`/sermons/${sermon.slug}`}>
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                      {sermon.title}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                    {settings.showSpeaker !== false && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        {sermon.speaker}
                      </span>
                    )}
                    <span>{formatDate(sermon.preachedAt)}</span>
                  </div>
                  {sermon.scripture && settings.showScripture !== false && (
                    <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--template-primary)' }}>
                      <BookOpenIcon className="w-4 h-4" />
                      {sermon.scripture}
                    </p>
                  )}
                </CardContent>
                <div className="flex items-center p-4 gap-2">
                  {sermon.audioUrl && (
                    <Button size="sm" variant="outline">
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Audio
                    </Button>
                  )}
                  {sermon.videoUrl && (
                    <Button size="sm">
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Video
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Default: Grid variant
  return (
    <section style={{ backgroundColor: 'var(--template-muted)' }}>
      <div className="template-container template-section">
        {data.title && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: 'var(--template-font-heading)' }}
              >
                {data.title}
              </h2>
              {data.subtitle && (
                <p className="text-muted-foreground mt-2">{data.subtitle}</p>
              )}
            </div>
            {data.showViewAll && data.viewAllUrl && (
              <Button variant="ghost" asChild>
                <Link href={data.viewAllUrl}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(320px, 1fr))`,
          }}
        >
          {sermons.map((sermon) => (
            <Card
              key={sermon.id}
              className="overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <Link href={`/sermons/${sermon.slug}`}>
                <div className="relative aspect-video bg-muted">
                  {sermon.thumbnail ? (
                    <Image
                      src={sermon.thumbnail}
                      alt={sermon.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PlayIcon className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  {sermon.duration && settings.showDuration !== false && (
                    <Badge className="absolute bottom-2 right-2 bg-black/70">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {Math.floor(sermon.duration / 60)}:{String(sermon.duration % 60).padStart(2, '0')}
                    </Badge>
                  )}
                  {(sermon.audioUrl || sermon.videoUrl) && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center bg-white/90"
                        style={{ color: 'var(--template-primary)' }}
                      >
                        <PlayIcon className="w-7 h-7 ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              </Link>

              <CardHeader className="pb-2">
                {sermon.seriesName && (
                  <Badge variant="secondary" className="w-fit mb-2">
                    {sermon.seriesName}
                  </Badge>
                )}
                <Link href={`/sermons/${sermon.slug}`}>
                  <h3
                    className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors"
                    style={{ fontFamily: 'var(--template-font-heading)' }}
                  >
                    {sermon.title}
                  </h3>
                </Link>
                {sermon.scripture && settings.showScripture !== false && (
                  <p className="text-sm" style={{ color: 'var(--template-primary)' }}>
                    {sermon.scripture}
                  </p>
                )}
              </CardHeader>

              <CardFooter className="text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-4">
                  {settings.showSpeaker !== false && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {sermon.speaker}
                    </span>
                  )}
                  <span>{formatDate(sermon.preachedAt)}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 7. Template-Specific Components

### Dynamic Component Loading

```typescript
// components/template/TemplateComponent.tsx
'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { useTemplate } from '@/contexts/TemplateContext';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface TemplateComponentProps {
  componentName: string;
  fallbackComponent?: ComponentType<any>;
  props?: Record<string, any>;
}

export function TemplateComponent({
  componentName,
  fallbackComponent,
  props = {},
}: TemplateComponentProps) {
  const { templateId } = useTemplate();

  // Dynamic import with fallback chain
  const Component = dynamic(
    () =>
      import(`@/templates/${templateId}/components/${componentName}`)
        .catch(() => import(`@/templates/_shared/components/${componentName}`))
        .catch(() => {
          if (fallbackComponent) {
            return { default: fallbackComponent };
          }
          return {
            default: () => (
              <div className="p-4 text-sm text-muted-foreground bg-muted rounded">
                Component "{componentName}" not found for template "{templateId}"
              </div>
            ),
          };
        }),
    {
      loading: () => <LoadingSpinner size="sm" />,
      ssr: true,
    }
  );

  return (
    <Suspense fallback={<LoadingSpinner size="sm" />}>
      <Component {...props} />
    </Suspense>
  );
}
```

### Template-Specific Header

```typescript
// templates/modern-church/components/Header/index.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MenuIcon, XIcon, SearchIcon, UserIcon } from 'lucide-react';
import { useTemplate } from '@/contexts/TemplateContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  target?: string;
  children?: NavigationItem[];
}

interface HeaderProps {
  navigation: NavigationItem[];
  logo?: string;
  siteName: string;
}

export default function ModernChurchHeader({
  navigation,
  logo,
  siteName,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { config, getComponentConfig } = useTemplate();

  const headerConfig = getComponentConfig('header');
  const showSearch = headerConfig?.showSearch ?? true;
  const showGiveButton = headerConfig?.showGiveButton ?? true;
  const showLoginButton = headerConfig?.showLoginButton ?? true;
  const stickyHeader = headerConfig?.stickyHeader ?? true;
  const ctaText = headerConfig?.ctaText || 'Give';
  const ctaUrl = headerConfig?.ctaUrl || '/give';

  return (
    <header
      className={cn(
        'w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50',
        stickyHeader && 'sticky top-0'
      )}
      style={{ borderColor: 'var(--template-border)' }}
    >
      <div className="template-container">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt={siteName} className="h-10 w-auto" />
            ) : (
              <span
                className="text-2xl font-bold"
                style={{
                  color: 'var(--template-primary)',
                  fontFamily: 'var(--template-font-heading)',
                }}
              >
                {siteName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {showSearch && (
              <Button variant="ghost" size="icon">
                <SearchIcon className="h-5 w-5" />
              </Button>
            )}

            {showLoginButton && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <UserIcon className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {showGiveButton && (
              <Button asChild>
                <Link href={ctaUrl}>{ctaText}</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ))}
              <div className="pt-4 mt-4 border-t flex flex-col gap-2">
                {showLoginButton && (
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <UserIcon className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                )}
                {showGiveButton && (
                  <Button asChild>
                    <Link href={ctaUrl} onClick={() => setMobileMenuOpen(false)}>
                      {ctaText}
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function NavItem({ item }: { item: NavigationItem }) {
  if (item.children && item.children.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          {item.title}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {item.children.map((child) => (
            <DropdownMenuItem key={child.id} asChild>
              <Link href={child.url} target={child.target}>
                {child.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      href={item.url}
      target={item.target}
      className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
    >
      {item.title}
    </Link>
  );
}

function MobileNavItem({
  item,
  onClose,
}: {
  item: NavigationItem;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full px-4 py-2 text-left font-medium"
        >
          {item.title}
          <span className={cn('transition-transform', expanded && 'rotate-180')}>
            ▼
          </span>
        </button>
        {expanded && (
          <div className="ml-4 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.id}
                href={child.url}
                target={child.target}
                onClick={onClose}
                className="block px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                {child.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.url}
      target={item.target}
      onClick={onClose}
      className="block px-4 py-2 font-medium"
    >
      {item.title}
    </Link>
  );
}
```

---

## 8. Template Management

### Template Selection Page

```typescript
// app/admin/settings/template/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, EyeIcon, Loader2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  previewUrl: string;
  screenshots: string[];
  requiredPlan: string;
  isDefault: boolean;
  isFeatured: boolean;
  usageCount: number;
  rating: number;
}

export default function TemplateSelectionPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/templates');
      return response.json();
    },
  });

  const { data: currentTemplate } = useQuery<{ templateId: string }>({
    queryKey: ['current-template'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/template');
      return response.json();
    },
  });

  const selectTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch('/api/admin/settings/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-template'] });
      toast.success('Template updated successfully');
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'modern', name: 'Modern' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'vibrant', name: 'Vibrant' },
  ];

  const filteredTemplates = templates?.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Website Template</h1>
        <p className="text-muted-foreground">
          Choose a template that best represents your church's identity
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates?.map((template) => {
            const isSelected = currentTemplate?.templateId === template.slug;

            return (
              <Card
                key={template.id}
                className={cn(
                  'overflow-hidden cursor-pointer transition-all hover:shadow-lg',
                  isSelected && 'ring-2 ring-primary'
                )}
              >
                {/* Preview Image */}
                <div className="relative aspect-[16/10] bg-muted">
                  <Image
                    src={template.previewUrl}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                  )}
                  {template.isFeatured && (
                    <Badge className="absolute top-3 left-3">Featured</Badge>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.name}</span>
                    <Badge variant="secondary" className="capitalize">
                      {template.category}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{template.usageCount} churches</span>
                    <span>★ {template.rating.toFixed(1)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl">
                        <TemplatePreview template={template} />
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isSelected || selectTemplate.isPending}
                      onClick={() => selectTemplate.mutate(template.slug)}
                    >
                      {isSelected ? 'Current' : 'Select'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TemplatePreview({ template }: { template: Template }) {
  const [currentScreenshot, setCurrentScreenshot] = useState(0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{template.name}</h2>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      {/* Screenshot Gallery */}
      <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
        <Image
          src={template.screenshots[currentScreenshot] || template.previewUrl}
          alt={`${template.name} screenshot ${currentScreenshot + 1}`}
          fill
          className="object-cover"
        />
      </div>

      {/* Screenshot Thumbnails */}
      {template.screenshots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {template.screenshots.map((screenshot, index) => (
            <button
              key={index}
              onClick={() => setCurrentScreenshot(index)}
              className={cn(
                'relative w-24 aspect-[16/9] rounded overflow-hidden flex-shrink-0',
                currentScreenshot === index && 'ring-2 ring-primary'
              )}
            >
              <Image
                src={screenshot}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Features */}
      <div className="flex flex-wrap gap-2">
        {template.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
```

### Template API Endpoints

```typescript
// app/api/admin/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// app/api/admin/settings/template/route.ts
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { templateId: true },
    });

    return NextResponse.json({ templateId: tenant?.templateId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch current template' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    await requireRole(session, ['ADMIN', 'SUPERUSER']);

    const { templateId } = await req.json();

    // Verify template exists and is active
    const template = await prisma.template.findFirst({
      where: { slug: templateId, isActive: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update tenant's template
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { templateId },
    });

    // Increment usage count
    await prisma.template.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, templateId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
```

---

## 9. Theme Customizer

### Visual Theme Customizer Component

```typescript
// app/admin/settings/theme/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCwIcon, SaveIcon, Undo2Icon, PaletteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface ThemeConfig {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  borderRadius: string;
  shadows: Record<string, string>;
  spacing: Record<string, string>;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)' },
  { value: 'Lora', label: 'Lora (Classic)' },
  { value: 'Merriweather', label: 'Merriweather (Traditional)' },
  { value: 'Montserrat', label: 'Montserrat (Bold)' },
  { value: 'Poppins', label: 'Poppins (Trendy)' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro (Professional)' },
];

const BORDER_RADIUS_OPTIONS = [
  { value: '0', label: 'None (Sharp)' },
  { value: '0.25rem', label: 'Small (0.25rem)' },
  { value: '0.5rem', label: 'Medium (0.5rem)' },
  { value: '0.75rem', label: 'Large (0.75rem)' },
  { value: '1rem', label: 'Extra Large (1rem)' },
  { value: '1.5rem', label: 'Rounded (1.5rem)' },
];

const COLOR_PRESETS = [
  {
    name: 'Ocean Blue',
    colors: {
      primary: '#0ea5e9',
      secondary: '#1e293b',
      accent: '#f97316',
    },
  },
  {
    name: 'Forest Green',
    colors: {
      primary: '#22c55e',
      secondary: '#14532d',
      accent: '#eab308',
    },
  },
  {
    name: 'Royal Purple',
    colors: {
      primary: '#8b5cf6',
      secondary: '#581c87',
      accent: '#f472b6',
    },
  },
  {
    name: 'Warm Earth',
    colors: {
      primary: '#d97706',
      secondary: '#78350f',
      accent: '#dc2626',
    },
  },
  {
    name: 'Classic Navy',
    colors: {
      primary: '#1e40af',
      secondary: '#172554',
      accent: '#fbbf24',
    },
  },
];

export default function ThemeCustomizerPage() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current customization
  const { data: customization, isLoading } = useQuery({
    queryKey: ['theme-customization'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/theme');
      return response.json();
    },
  });

  // Local state for editing
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);

  // Initialize local state when data loads
  useEffect(() => {
    if (customization?.theme) {
      setThemeConfig(customization.theme);
    }
  }, [customization]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (config: ThemeConfig) => {
      const response = await fetch('/api/admin/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: config }),
      });
      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-customization'] });
      setHasChanges(false);
      toast.success('Theme saved successfully');
    },
    onError: () => {
      toast.error('Failed to save theme');
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/settings/theme/reset', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-customization'] });
      setHasChanges(false);
      toast.success('Theme reset to template defaults');
    },
    onError: () => {
      toast.error('Failed to reset theme');
    },
  });

  const updateColor = (key: string, value: string) => {
    if (!themeConfig) return;
    setThemeConfig({
      ...themeConfig,
      colors: { ...themeConfig.colors, [key]: value },
    });
    setHasChanges(true);
  };

  const updateFont = (key: string, value: string) => {
    if (!themeConfig) return;
    setThemeConfig({
      ...themeConfig,
      fonts: { ...themeConfig.fonts, [key]: value },
    });
    setHasChanges(true);
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    if (!themeConfig) return;
    setThemeConfig({
      ...themeConfig,
      colors: { ...themeConfig.colors, ...preset.colors },
    });
    setHasChanges(true);
  };

  if (isLoading || !themeConfig) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Theme Customization</h1>
          <p className="text-muted-foreground">
            Customize colors, fonts, and styling for your website
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            <Undo2Icon className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button
            onClick={() => saveMutation.mutate(themeConfig)}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customization Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="colors">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6 mt-6">
              {/* Color Presets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PaletteIcon className="h-4 w-4" />
                    Color Presets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="flex -space-x-1">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: preset.colors.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                        </div>
                        <span className="text-sm">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Individual Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Brand Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['primary', 'secondary', 'accent'].map((colorKey) => (
                    <div key={colorKey} className="flex items-center gap-4">
                      <Label className="w-24 capitalize">{colorKey}</Label>
                      <div className="flex-1 flex gap-2">
                        <Input
                          type="color"
                          value={themeConfig.colors[colorKey]}
                          onChange={(e) => updateColor(colorKey, e.target.value)}
                          className="w-14 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={themeConfig.colors[colorKey]}
                          onChange={(e) => updateColor(colorKey, e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Interface Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['background', 'foreground', 'muted', 'border'].map((colorKey) => (
                    <div key={colorKey} className="flex items-center gap-4">
                      <Label className="w-24 capitalize">{colorKey}</Label>
                      <div className="flex-1 flex gap-2">
                        <Input
                          type="color"
                          value={themeConfig.colors[colorKey]}
                          onChange={(e) => updateColor(colorKey, e.target.value)}
                          className="w-14 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={themeConfig.colors[colorKey]}
                          onChange={(e) => updateColor(colorKey, e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Font Families</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Heading Font</Label>
                    <Select
                      value={themeConfig.fonts.heading}
                      onValueChange={(value) => updateFont('heading', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Body Font</Label>
                    <Select
                      value={themeConfig.fonts.body}
                      onValueChange={(value) => updateFont('body', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Styling Tab */}
            <TabsContent value="styling" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Border Radius</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={themeConfig.borderRadius}
                    onValueChange={(value) => {
                      setThemeConfig({ ...themeConfig, borderRadius: value });
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BORDER_RADIUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemePreview config={themeConfig} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ config }: { config: ThemeConfig }) {
  return (
    <div
      className="p-6 rounded-lg border space-y-6"
      style={{
        backgroundColor: config.colors.background,
        color: config.colors.foreground,
        fontFamily: `'${config.fonts.body}', sans-serif`,
      }}
    >
      {/* Heading */}
      <div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: `'${config.fonts.heading}', serif`,
            color: config.colors.primary,
          }}
        >
          Welcome to Our Church
        </h2>
        <p style={{ color: config.colors.foreground }}>
          This is sample body text to preview how your content will look with the
          current theme settings.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 text-white font-medium"
          style={{
            backgroundColor: config.colors.primary,
            borderRadius: config.borderRadius,
          }}
        >
          Primary Button
        </button>
        <button
          className="px-4 py-2 text-white font-medium"
          style={{
            backgroundColor: config.colors.secondary,
            borderRadius: config.borderRadius,
          }}
        >
          Secondary
        </button>
        <button
          className="px-4 py-2 text-white font-medium"
          style={{
            backgroundColor: config.colors.accent,
            borderRadius: config.borderRadius,
          }}
        >
          Accent
        </button>
      </div>

      {/* Card Preview */}
      <div
        className="p-4 border"
        style={{
          borderColor: config.colors.border,
          backgroundColor: config.colors.muted,
          borderRadius: config.borderRadius,
        }}
      >
        <h3
          className="font-semibold mb-2"
          style={{ fontFamily: `'${config.fonts.heading}', serif` }}
        >
          Sample Card
        </h3>
        <p className="text-sm" style={{ color: config.colors.foreground }}>
          Cards and sections will use these styles throughout your website.
        </p>
      </div>
    </div>
  );
}
```

---

## 10. Template Marketplace

### Marketplace Overview

```typescript
// types/marketplace.ts
export interface MarketplaceTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;

  // Metadata
  category: string;
  tags: string[];
  version: string;

  // Pricing
  price: number; // 0 for free
  currency: string;
  requiredPlan: string;

  // Media
  previewUrl: string;
  screenshots: string[];
  demoUrl?: string;

  // Stats
  usageCount: number;
  rating: number;
  reviewCount: number;

  // Features
  features: string[];
  supportedSections: string[];

  // Author
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };

  // Status
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;

  user: {
    name: string;
    avatar?: string;
    churchName?: string;
  };

  createdAt: Date;
}
```

### Marketplace API

```typescript
// app/api/marketplace/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');

  const where: any = {
    isActive: true,
  };

  if (category && category !== 'all') {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ];
  }

  const orderBy: any = {};
  switch (sort) {
    case 'popular':
      orderBy.usageCount = 'desc';
      break;
    case 'rating':
      orderBy.rating = 'desc';
      break;
    case 'newest':
      orderBy.createdAt = 'desc';
      break;
    case 'featured':
    default:
      orderBy.isFeatured = 'desc';
      break;
  }

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.template.count({ where }),
  ]);

  return NextResponse.json({
    templates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

---

## 11. Version Control

### Customization History Tracking

```typescript
// lib/template/version-control.ts
import { prisma } from '@/lib/prisma';

export async function saveCustomizationVersion(
  customizationId: string,
  userId: string,
  changeNote?: string
) {
  const customization = await prisma.templateCustomization.findUnique({
    where: { id: customizationId },
  });

  if (!customization) {
    throw new Error('Customization not found');
  }

  // Save current state to history
  await prisma.templateCustomizationHistory.create({
    data: {
      customizationId,
      version: customization.version,
      customizations: customization.customizations as any,
      customCss: customization.customCss,
      changedBy: userId,
      changeNote,
    },
  });

  // Increment version
  await prisma.templateCustomization.update({
    where: { id: customizationId },
    data: { version: { increment: 1 } },
  });
}

export async function restoreCustomizationVersion(
  customizationId: string,
  version: number,
  userId: string
) {
  const history = await prisma.templateCustomizationHistory.findFirst({
    where: {
      customizationId,
      version,
    },
  });

  if (!history) {
    throw new Error('Version not found');
  }

  // Save current state first
  await saveCustomizationVersion(
    customizationId,
    userId,
    `Before restoring to version ${version}`
  );

  // Restore the historical version
  await prisma.templateCustomization.update({
    where: { id: customizationId },
    data: {
      customizations: history.customizations as any,
      customCss: history.customCss,
    },
  });

  return history;
}

export async function getCustomizationHistory(
  customizationId: string,
  limit = 20
) {
  return prisma.templateCustomizationHistory.findMany({
    where: { customizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function compareVersions(
  customizationId: string,
  versionA: number,
  versionB: number
) {
  const [historyA, historyB] = await Promise.all([
    prisma.templateCustomizationHistory.findFirst({
      where: { customizationId, version: versionA },
    }),
    prisma.templateCustomizationHistory.findFirst({
      where: { customizationId, version: versionB },
    }),
  ]);

  if (!historyA || !historyB) {
    throw new Error('One or both versions not found');
  }

  // Generate diff
  return {
    versionA: {
      version: historyA.version,
      customizations: historyA.customizations,
      createdAt: historyA.createdAt,
    },
    versionB: {
      version: historyB.version,
      customizations: historyB.customizations,
      createdAt: historyB.createdAt,
    },
    // Diff can be computed on client side for better UX
  };
}
```

---

## 12. Best Practices

### Template Development Guidelines

```markdown
## Template Development Best Practices

### 1. Component Structure
- Use atomic design principles
- Create template-specific components only when necessary
- Prefer extending shared components over duplicating code

### 2. Theme Variables
- Always use CSS variables for colors, fonts, and spacing
- Never hardcode colors or sizes in template components
- Provide sensible fallback values

### 3. Responsive Design
- Mobile-first approach
- Test all templates on multiple screen sizes
- Use CSS Grid and Flexbox for layouts

### 4. Performance
- Lazy load template-specific components
- Optimize images in template previews
- Minimize CSS and JavaScript bundle size

### 5. Accessibility
- Maintain WCAG 2.1 AA compliance
- Ensure proper color contrast ratios
- Support keyboard navigation

### 6. Documentation
- Document all configurable options
- Provide usage examples
- Include screenshot references

### 7. Version Control
- Use semantic versioning
- Document breaking changes
- Maintain upgrade paths
```

### Template Configuration Checklist

```typescript
// Template configuration validation
const REQUIRED_CONFIG_FIELDS = [
  'templateId',
  'templateName',
  'version',
  'theme.colors.primary',
  'theme.colors.secondary',
  'theme.fonts.heading',
  'theme.fonts.body',
  'theme.borderRadius',
];

const REQUIRED_SECTIONS = [
  'hero_image',
  'sermons_list',
  'events_grid',
  'welcome_with_image',
];

export function validateTemplateConfig(config: TemplateConfig): string[] {
  const errors: string[] = [];

  // Check required fields
  REQUIRED_CONFIG_FIELDS.forEach((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config as any);
    if (!value) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check required sections
  REQUIRED_SECTIONS.forEach((section) => {
    if (!config.sections?.[section]) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  // Validate color format
  Object.entries(config.theme.colors).forEach(([key, value]) => {
    if (!isValidColor(value)) {
      errors.push(`Invalid color format for ${key}: ${value}`);
    }
  });

  return errors;
}

function isValidColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color) ||
         /^rgb\([\d\s,]+\)$/i.test(color) ||
         /^hsl\([\d\s%,]+\)$/i.test(color);
}
```

---

## Summary

The Multi-Template Design System provides:

1. **Multiple Professional Templates**: Pre-built designs for various church styles
2. **Per-Tenant Customization**: Each church maintains independent theme settings
3. **Section Variants**: 3-5 display options for each content section type
4. **Theme Builder**: Visual customization without code knowledge
5. **Version Control**: Track and rollback customization changes
6. **Template Marketplace**: Discover and install community templates
7. **CSS Variable System**: Consistent theming across all components
8. **Dynamic Component Loading**: Efficient template-specific component delivery

### Key Files Reference

| File | Purpose |
|------|---------|
| `lib/template/loader.ts` | Template configuration loading |
| `contexts/TemplateContext.tsx` | Template context provider |
| `components/template/SectionRenderer.tsx` | Dynamic section rendering |
| `app/admin/settings/template/page.tsx` | Template selection UI |
| `app/admin/settings/theme/page.tsx` | Theme customizer UI |
| `templates/{id}/config.json` | Template configuration |

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
