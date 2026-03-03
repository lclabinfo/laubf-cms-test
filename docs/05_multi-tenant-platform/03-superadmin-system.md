# Superadmin System Design

---

## What the Superadmin Console Does

A separate admin area (route group `(platform-admin)`) where **we** manage all churches on the platform. Think of it as the Vercel dashboard, but for churches.

---

## Route Structure

```
app/
  (platform-admin)/
    admin/
      layout.tsx              # Sidebar: Dashboard, Churches, Billing, Support, Settings
      page.tsx                # Dashboard: KPIs, revenue, active churches, recent signups
      churches/
        page.tsx              # All churches table (name, plan, status, MRR, last active)
        [churchId]/
          page.tsx            # Church detail: profile, subscription, usage, members
          impersonate/
            route.ts          # API: start impersonation session
      billing/
        page.tsx              # Revenue dashboard, MRR chart, plan distribution
        invoices/
          page.tsx            # All invoices across churches
      support/
        page.tsx              # Support tickets (all churches)
        [ticketId]/
          page.tsx            # Ticket detail + conversation thread
      feature-flags/
        page.tsx              # Per-church feature overrides
      templates/
        page.tsx              # Manage website templates
      settings/
        page.tsx              # Platform-level settings (default plan, trial length, etc.)
```

---

## Dashboard KPIs

| Metric | Source | Visualization |
|--------|--------|---------------|
| Total churches | `Church.count()` | Big number |
| Active this month | Churches with login in last 30 days | Big number |
| MRR (monthly recurring revenue) | Sum of active subscription prices | Big number + chart |
| New signups (this month) | `Church.where(createdAt > startOfMonth)` | Big number |
| Trial conversion rate | Trials → Paid in last 90 days | Percentage |
| Churn rate | Canceled / Total active | Percentage |
| Support tickets open | `SupportTicket.where(status: OPEN)` | Badge count |
| Storage usage | Sum of `UsageMetric.where(metric: STORAGE)` | Progress bar |

---

## Church Management

### Church List View
Table with columns:
- Church name (link to detail)
- Plan tier (badge: Free/Starter/Pro/Enterprise)
- Status (badge: Trial/Active/Suspended/Deactivated)
- MRR contribution
- Members count
- Last admin login
- Created date
- Actions (View, Impersonate, Suspend)

### Church Detail View
- **Profile tab**: Name, slug, domain, contact info, creation date
- **Subscription tab**: Current plan, billing history, payment method (via Stripe link)
- **Usage tab**: Storage used, API calls, page views, admin users
- **Members tab**: List of ChurchMember records (users with access to this church's CMS)
- **Feature flags tab**: Override specific features for this church
- **Audit log tab**: Recent activity for this church
- **Danger zone**: Suspend, deactivate, delete church (with confirmation)

---

## Impersonation

Lets a platform admin view a church's CMS as if they were the church's OWNER. Critical for debugging issues and providing support.

### Flow
1. Platform admin clicks "Impersonate" on a church
2. Server creates a signed impersonation token (JWT with `realUserId`, `impersonatedChurchId`, 1-hour expiry)
3. Token stored in `httpOnly` cookie named `impersonation`
4. All tenant resolution checks for impersonation cookie first
5. CMS shows a prominent yellow banner: "Viewing as [Church Name] — Exit Impersonation"
6. Clicking "Exit" clears the cookie and redirects to superadmin console

### Security
- Only `isPlatformAdmin` users can impersonate
- All actions during impersonation are logged in AuditLog with `impersonatedBy` field
- Token expires after 1 hour (configurable)
- Impersonation cannot change billing or delete the church

---

## Support Ticket System

### For churches (in their CMS)
- "Help & Support" link in CMS sidebar footer
- Opens a dialog/page to submit a ticket:
  - Category: Bug Report / Feature Request / Question / Billing Issue
  - Subject
  - Description (rich text)
  - Screenshot upload (optional, via R2)
  - Priority auto-assigned based on category (Bug = High, Question = Normal)

### For superadmin
- Ticket queue with filters (status, priority, category, church)
- Ticket detail with conversation thread
- Internal notes (visible to admins only, not the church)
- Assign to team member
- Status transitions: Open → In Progress → Resolved → Closed
- Bulk actions (close resolved, reassign)

### Notifications
- Email to church admin when ticket is responded to
- Email to superadmin when new ticket is submitted
- Slack webhook for urgent tickets (optional)

---

## Auth Changes Required

### Add to User model
```prisma
model User {
  // ... existing fields
  isPlatformAdmin  Boolean  @default(false)
}
```

### Middleware guard for platform admin routes
```typescript
// In middleware.ts or (platform-admin)/layout.tsx
const session = await auth()
if (!session?.user?.isPlatformAdmin) {
  redirect('/cms/login')
}
```

### Auth hierarchy
```
PLATFORM_ADMIN (us — superadmin, can see all churches)
  └── OWNER (church owner — full access to their church)
      └── ADMIN (church admin — content + users, no billing)
          └── EDITOR (content creator)
              └── VIEWER (read-only)
```

Platform admin can impersonate any OWNER. OWNER cannot see other churches.
