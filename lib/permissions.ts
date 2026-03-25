// lib/permissions.ts
// Single source of truth for all CMS permissions and default role definitions.

export const PERMISSIONS = {
  // Content
  'messages.view': 'View messages & bible studies',
  'messages.create': 'Create messages & bible studies',
  'messages.edit_own': 'Edit own messages & bible studies',
  'messages.edit_all': 'Edit all messages & bible studies',
  'messages.delete': 'Delete messages & bible studies',
  'messages.publish': 'Publish / unpublish messages & bible studies',

  'events.view': 'View events',
  'events.create': 'Create events',
  'events.edit_own': 'Edit own events',
  'events.edit_all': 'Edit all events',
  'events.delete': 'Delete events',
  'events.publish': 'Publish / unpublish events',

  'media.view': 'View media library',
  'media.upload': 'Upload files',
  'media.edit_own': 'Edit own files',
  'media.edit_all': 'Edit all files',
  'media.delete': 'Delete files',
  'media.manage_folders': 'Manage folders',

  'submissions.view': 'View form submissions',
  'submissions.manage': 'Manage submissions (read, delete)',

  'storage.view': 'View storage usage',

  // People
  'people.view': 'View people & members',
  'people.create': 'Add people',
  'people.edit': 'Edit people',
  'people.delete': 'Delete people',

  'groups.view': 'View groups',
  'groups.manage': 'Manage groups',

  'ministries.view': 'View ministries',
  'ministries.manage': 'Manage ministries',

  'campuses.view': 'View campuses',
  'campuses.manage': 'Manage campuses',

  // Website
  'website.pages.view': 'View pages',
  'website.pages.edit': 'Edit pages & sections',
  'website.pages.create': 'Create pages',
  'website.pages.delete': 'Delete pages',

  'website.navigation.view': 'View navigation',
  'website.navigation.edit': 'Edit navigation',

  'website.theme.view': 'View theme',
  'website.theme.edit': 'Edit theme & branding',

  'website.settings.view': 'View site settings',
  'website.settings.edit': 'Edit site settings',

  'website.domains.view': 'View domains',
  'website.domains.manage': 'Manage domains',

  // Admin
  'users.view': 'View team members',
  'users.invite': 'Invite new members',
  'users.edit_roles': 'Change member roles',
  'users.remove': 'Remove members',
  'users.deactivate': 'Deactivate / reactivate members',
  'users.approve_requests': 'Approve / deny access requests',

  'roles.view': 'View roles',
  'roles.manage': 'Manage roles & permissions',

  'church.profile.view': 'View church profile',
  'church.profile.edit': 'Edit church profile',
} as const

export type Permission = keyof typeof PERMISSIONS

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]

/**
 * Permission groups for the role editor UI.
 * Organized by CMS area — each group maps to a logical section.
 */
export const PERMISSION_GROUPS: Record<string, { label: string; description: string; permissions: Permission[] }> = {
  content: {
    label: 'Content',
    description: 'Messages, bible studies, and events',
    permissions: [
      'messages.view', 'messages.create', 'messages.edit_own', 'messages.edit_all',
      'messages.delete', 'messages.publish',
      'events.view', 'events.create', 'events.edit_own', 'events.edit_all',
      'events.delete', 'events.publish',
    ],
  },
  media: {
    label: 'Media & Storage',
    description: 'Photos, videos, folders, and storage',
    permissions: [
      'media.view', 'media.upload', 'media.edit_own', 'media.edit_all',
      'media.delete', 'media.manage_folders',
      'storage.view',
    ],
  },
  people: {
    label: 'People',
    description: 'Members, groups, ministries, and campuses',
    permissions: [
      'people.view', 'people.create', 'people.edit', 'people.delete',
      'groups.view', 'groups.manage',
      'ministries.view', 'ministries.manage',
      'campuses.view', 'campuses.manage',
    ],
  },
  website: {
    label: 'Website',
    description: 'Pages, navigation, theme, settings, and domains',
    permissions: [
      'website.pages.view', 'website.pages.edit', 'website.pages.create', 'website.pages.delete',
      'website.navigation.view', 'website.navigation.edit',
      'website.theme.view', 'website.theme.edit',
      'website.settings.view', 'website.settings.edit',
      'website.domains.view', 'website.domains.manage',
    ],
  },
  submissions: {
    label: 'Submissions',
    description: 'Form submissions from the website',
    permissions: ['submissions.view', 'submissions.manage'],
  },
  admin: {
    label: 'Administration',
    description: 'Team members, roles, and church profile',
    permissions: [
      'users.view', 'users.invite', 'users.edit_roles', 'users.remove', 'users.deactivate',
      'users.approve_requests',
      'roles.view', 'roles.manage',
      'church.profile.view', 'church.profile.edit',
    ],
  },
}

// Default role definitions - seeded for every new church
export interface DefaultRoleDef {
  name: string
  slug: string
  description: string
  priority: number
  isSystem: boolean
  color: string
  permissions: Permission[]
}

export const DEFAULT_ROLES: Record<string, DefaultRoleDef> = {
  OWNER: {
    name: 'Owner (Dev)',
    slug: 'owner',
    description: 'Full access to everything including website builder. Cannot be deleted.',
    priority: 1000,
    isSystem: true,
    color: 'purple',
    permissions: ALL_PERMISSIONS,
  },
  ADMIN: {
    name: 'Admin',
    slug: 'admin',
    description: 'Full content and site management. Can invite and manage team members.',
    priority: 500,
    isSystem: false,
    color: 'blue',
    permissions: [
      'messages.view', 'messages.create', 'messages.edit_own', 'messages.edit_all',
      'messages.delete', 'messages.publish',
      'events.view', 'events.create', 'events.edit_own', 'events.edit_all',
      'events.delete', 'events.publish',
      'media.view', 'media.upload', 'media.edit_own', 'media.edit_all',
      'media.delete', 'media.manage_folders',
      'submissions.view', 'submissions.manage',
      'storage.view',
      'people.view', 'people.create', 'people.edit', 'people.delete',
      'groups.view', 'groups.manage',
      'ministries.view', 'ministries.manage',
      'campuses.view', 'campuses.manage',
      'website.pages.view',
      'website.navigation.view', 'website.navigation.edit',
      'website.theme.view',
      'website.settings.view',
      'website.domains.view',
      'users.view', 'users.invite', 'users.edit_roles', 'users.remove',
      'users.deactivate', 'users.approve_requests',
      'roles.view', 'roles.manage',
      'church.profile.view', 'church.profile.edit',
    ],
  },
  EDITOR: {
    name: 'Editor',
    slug: 'editor',
    description: 'Create and edit own content. Upload media. Read-only access to everything else.',
    priority: 200,
    isSystem: false,
    color: 'green',
    permissions: [
      'messages.view', 'messages.create', 'messages.edit_own',
      'events.view', 'events.create', 'events.edit_own',
      'media.view', 'media.upload', 'media.edit_own',
      'submissions.view',
      'storage.view',
      'people.view',
      'groups.view',
      'ministries.view',
      'campuses.view',
      'website.pages.view',
      'website.navigation.view',
      'website.theme.view',
      'church.profile.view',
    ],
  },
  VIEWER: {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access to all CMS content. Cannot make changes.',
    priority: 0,
    isSystem: true,
    color: 'gray',
    permissions: [
      'messages.view',
      'events.view',
      'media.view',
      'submissions.view',
      'storage.view',
      'people.view',
      'groups.view',
      'ministries.view',
      'campuses.view',
      'church.profile.view',
    ],
  },
}

/** Check if a user has a specific permission */
export function hasPermission(
  permissions: string[],
  required: Permission | Permission[],
): boolean {
  const requiredArr = Array.isArray(required) ? required : [required]
  const permSet = new Set(permissions)
  return requiredArr.every((p) => permSet.has(p))
}

/** Check if a user has ANY of the given permissions */
export function hasAnyPermission(
  permissions: string[],
  required: Permission[],
): boolean {
  const permSet = new Set(permissions)
  return required.some((p) => permSet.has(p))
}
