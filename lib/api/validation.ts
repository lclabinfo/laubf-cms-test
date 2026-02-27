/**
 * Lightweight validation helpers for API route handlers.
 * Validates structural sanity of inputs — not a full validation library.
 */

const MAX_STRING_VALUE_LENGTH = 100 * 1024 // 100KB per string value
const MAX_CONTENT_DEPTH = 10

type ValidationError = { code: 'VALIDATION_ERROR'; message: string }
type ValidationResult = { valid: true } | { valid: false; error: ValidationError }

// --- General-purpose field validators ---

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fail(message: string): ValidationResult {
  return { valid: false, error: { code: 'VALIDATION_ERROR', message } }
}

const ok: ValidationResult = { valid: true }

/**
 * Validates a title string: required, max 200 chars.
 */
export function validateTitle(title: unknown, fieldName = 'title'): ValidationResult {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return fail(`${fieldName} is required and must be a non-empty string`)
  }
  if (title.length > 200) {
    return fail(`${fieldName} must be 200 characters or less`)
  }
  return ok
}

/**
 * Validates a slug: required, max 100 chars, lowercase-alphanumeric-hyphen format.
 */
export function validateSlug(slug: unknown): ValidationResult {
  if (typeof slug !== 'string' || slug.trim().length === 0) {
    return fail('slug is required and must be a non-empty string')
  }
  if (slug.length > 100) {
    return fail('slug must be 100 characters or less')
  }
  if (!SLUG_REGEX.test(slug)) {
    return fail('slug must be lowercase alphanumeric with hyphens (e.g., "my-page-slug")')
  }
  return ok
}

/**
 * Validates a long text field (description, body): optional, max 50,000 chars.
 */
export function validateLongText(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null) return ok
  if (typeof value !== 'string') {
    return fail(`${fieldName} must be a string`)
  }
  if (value.length > 50_000) {
    return fail(`${fieldName} must be 50,000 characters or less`)
  }
  return ok
}

/**
 * Validates an email field: optional, basic format check.
 */
export function validateEmail(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') return ok
  if (typeof value !== 'string') {
    return fail(`${fieldName} must be a string`)
  }
  if (!EMAIL_REGEX.test(value)) {
    return fail(`${fieldName} must be a valid email address`)
  }
  return ok
}

/**
 * Validates a URL field: optional, must start with http:// or https://.
 */
export function validateUrl(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') return ok
  if (typeof value !== 'string') {
    return fail(`${fieldName} must be a string`)
  }
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return fail(`${fieldName} must be an HTTP or HTTPS URL`)
    }
  } catch {
    return fail(`${fieldName} must be a valid URL`)
  }
  return ok
}

/**
 * Validates a value is one of the allowed enum strings.
 */
export function validateEnum(value: unknown, allowed: readonly string[], fieldName: string): ValidationResult {
  if (value === undefined || value === null) return ok
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return fail(`${fieldName} must be one of: ${allowed.join(', ')}`)
  }
  return ok
}

/**
 * Runs multiple validators and returns the first failure, or ok if all pass.
 */
export function validateAll(...results: ValidationResult[]): ValidationResult {
  for (const r of results) {
    if (!r.valid) return r
  }
  return ok
}

// Known enum values (kept in sync with Prisma schema)
export const CONTENT_STATUS_VALUES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const
export const EVENT_TYPE_VALUES = ['MEETING', 'EVENT', 'PROGRAM'] as const
export const VIDEO_CATEGORY_VALUES = ['EVENT_RECAP', 'WORSHIP', 'TESTIMONY', 'SPECIAL_FEATURE', 'DAILY_BREAD', 'PROMO', 'OTHER'] as const

/**
 * Validates that `content` is a sane JSON object for PageSection storage.
 * - Must be a non-null plain object (not array, not primitive)
 * - No individual string value exceeds 100KB
 * - No nesting deeper than 10 levels
 */
export function validateSectionContent(content: unknown): ValidationResult {
  if (content === undefined) {
    // content field is optional on PATCH — caller may not be updating it
    return { valid: true }
  }

  if (content === null || typeof content !== 'object' || Array.isArray(content)) {
    return {
      valid: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'content must be a JSON object (not null, array, or primitive)',
      },
    }
  }

  const depthError = checkDepthAndSize(content, 0)
  if (depthError) {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: depthError } }
  }

  return { valid: true }
}

function checkDepthAndSize(value: unknown, depth: number): string | null {
  if (depth > MAX_CONTENT_DEPTH) {
    return `content exceeds maximum nesting depth of ${MAX_CONTENT_DEPTH}`
  }

  if (typeof value === 'string' && value.length > MAX_STRING_VALUE_LENGTH) {
    return `content contains a string value exceeding ${MAX_STRING_VALUE_LENGTH / 1024}KB`
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const err = checkDepthAndSize(item, depth + 1)
      if (err) return err
    }
  } else if (value !== null && typeof value === 'object') {
    for (const val of Object.values(value as Record<string, unknown>)) {
      const err = checkDepthAndSize(val, depth + 1)
      if (err) return err
    }
  }

  return null
}

/**
 * Validates allowed fields for section create/update to prevent
 * mass-assignment of fields like `id`, `churchId`, `pageId`.
 */
const ALLOWED_SECTION_CREATE_FIELDS = new Set([
  'sectionType',
  'label',
  'sortOrder',
  'visible',
  'colorScheme',
  'paddingY',
  'containerWidth',
  'enableAnimations',
  'content',
])

const ALLOWED_SECTION_UPDATE_FIELDS = new Set([
  'label',
  'sortOrder',
  'visible',
  'colorScheme',
  'paddingY',
  'containerWidth',
  'enableAnimations',
  'content',
])

export function validateSectionCreateFields(body: Record<string, unknown>): ValidationResult {
  const disallowed = Object.keys(body).filter((k) => !ALLOWED_SECTION_CREATE_FIELDS.has(k))
  if (disallowed.length > 0) {
    return {
      valid: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Unexpected fields: ${disallowed.join(', ')}`,
      },
    }
  }
  return { valid: true }
}

export function validateSectionUpdateFields(body: Record<string, unknown>): ValidationResult {
  const disallowed = Object.keys(body).filter((k) => !ALLOWED_SECTION_UPDATE_FIELDS.has(k))
  if (disallowed.length > 0) {
    return {
      valid: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Unexpected fields: ${disallowed.join(', ')}`,
      },
    }
  }
  return { valid: true }
}
