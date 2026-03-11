// lib/permissions.ts
// Single source of truth for all CMS permissions and default role definitions.

export const PERMISSIONS = {
  // Content
  'messages.view': 'View Bible studies / messages',
  'messages.create': 'Create Bible studies / messages',
  'messages.edit_own': 'Edit own Bible studies / messages',
  'messages.edit_all': 'Edit any Bible study / message',
  'messages.delete': 'Delete Bible studies / messages',
  'messages.publish': 'Publish/unpublish Bible studies / messages',

  'events.view': 'View events',
  'events.create': 'Create events',
  'events.edit_own': 'Edit own events',
  'events.edit_all': 'Edit any event',
  'events.delete': 'Delete events',
  'events.publish': 'Publish/unpublish events',

  'media.view': 'View media library',
  'media.upload': 'Upload media files',
  'media.edit_own': 'Edit own media files',
  'media.edit_all': 'Edit any media file',
  'media.delete': 'Delete media files',
  'media.manage_folders': 'Create/rename/delete folders',

  'submissions.view': 'View form submissions',
  'submissions.manage': 'Mark as read, delete submissions',

  'storage.view': 'View storage usage',

  // People
  'people.view': 'View members and people',
  'people.create': 'Create people records',
  'people.edit': 'Edit people records',
  'people.delete': 'Delete people records',

  'groups.view': 'View groups',
  'groups.manage': 'Create, edit, delete groups',

  'ministries.view': 'View ministries',
  'ministries.manage': 'Create, edit, delete ministries',

  'campuses.view': 'View campuses',
  'campuses.manage': 'Create, edit, delete campuses',

  // Website
  'website.pages.view': 'View website pages',
  'website.pages.edit': 'Edit website pages and sections',
  'website.pages.create': 'Create new pages',
  'website.pages.delete': 'Delete pages',

  'website.navigation.view': 'View navigation menus',
  'website.navigation.edit': 'Edit navigation menus',

  'website.theme.view': 'View theme settings',
  'website.theme.edit': 'Edit theme and branding',

  'website.settings.view': 'View site settings',
  'website.settings.edit': 'Edit site settings',

  'website.domains.view': 'View domain configuration',
  'website.domains.manage': 'Add, remove, configure domains',

  // Admin
  'users.view': 'View CMS users',
  'users.invite': 'Invite new users',
  'users.edit_roles': 'Change user roles',
  'users.remove': 'Remove users from church',
  'users.deactivate': 'Deactivate/reactivate users',

  'roles.view': 'View roles and permissions',
  'roles.manage': 'Create, edit, delete custom roles',

  'church.profile.view': 'View church profile',
  'church.profile.edit': 'Edit church profile',
} as const

export type Permission = keyof typeof PERMISSIONS

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]

// Permission groups for the UI
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  'Bible Studies': [
    'messages.view', 'messages.create', 'messages.edit_own', 'messages.edit_all',
    'messages.delete', 'messages.publish',
  ],
  'Events': [
    'events.view', 'events.create', 'events.edit_own', 'events.edit_all',
    'events.delete', 'events.publish',
  ],
  'Media': [
    'media.view', 'media.upload', 'media.edit_own', 'media.edit_all',
    'media.delete', 'media.manage_folders',
  ],
  'Submissions': ['submissions.view', 'submissions.manage'],
  'Storage': ['storage.view'],
  'People': ['people.view', 'people.create', 'people.edit', 'people.delete'],
  'Groups': ['groups.view', 'groups.manage'],
  'Ministries': ['ministries.view', 'ministries.manage'],
  'Campuses': ['campuses.view', 'campuses.manage'],
  'Website Pages': [
    'website.pages.view', 'website.pages.edit', 'website.pages.create',
    'website.pages.delete',
  ],
  'Navigation': ['website.navigation.view', 'website.navigation.edit'],
  'Theme': ['website.theme.view', 'website.theme.edit'],
  'Site Settings': ['website.settings.view', 'website.settings.edit'],
  'Domains': ['website.domains.view', 'website.domains.manage'],
  'Users': [
    'users.view', 'users.invite', 'users.edit_roles', 'users.remove',
    'users.deactivate',
  ],
  'Roles': ['roles.view', 'roles.manage'],
  'Church Profile': ['church.profile.view', 'church.profile.edit'],
}

// Default role definitions - seeded for every new church
export interface DefaultRoleDef {
  name: string
  slug: string
  description: string
  priority: number
  isSystem: boolean
  permissions: Permission[]
}

export const DEFAULT_ROLES: Record<string, DefaultRoleDef> = {
  OWNER: {
    name: 'Owner',
    slug: 'owner',
    description: 'Full access to everything. Cannot be deleted.',
    priority: 1000,
    isSystem: true,
    permissions: ALL_PERMISSIONS,
  },
  ADMIN: {
    name: 'Admin',
    slug: 'admin',
    description: 'Full content and site management. Can invite users.',
    priority: 500,
    isSystem: false,
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
      'website.pages.view', 'website.pages.edit', 'website.pages.create',
      'website.pages.delete',
      'website.navigation.view', 'website.navigation.edit',
      'website.theme.view', 'website.theme.edit',
      'website.settings.view', 'website.settings.edit',
      'website.domains.view',
      'users.view', 'users.invite', 'users.edit_roles', 'users.deactivate',
      'roles.view',
      'church.profile.view', 'church.profile.edit',
    ],
  },
  EDITOR: {
    name: 'Editor',
    slug: 'editor',
    description: 'Create and edit own content. Upload media.',
    priority: 200,
    isSystem: false,
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
    description: 'Read-only access to the CMS.',
    priority: 0,
    isSystem: true,
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
