import { LibraryPage } from "./church/LibraryPage"
import { EventsPage } from "./church/EventsPage"
import { AnnouncementsPage } from "./church/AnnouncementsPage"
import { MinistriesPage } from "./church/ministries/MinistriesPage"
import { MediaPage } from "./church/MediaPage"
import { ChurchProfilePage } from "./church/ChurchProfilePage"

interface ChurchModuleProps {
  activePage: string
  initialItemId?: string | null
  onClearInitialItem?: () => void
  setSidebarOpen?: (isOpen: boolean) => void
}

export function ChurchModule({ activePage, initialItemId, onClearInitialItem, setSidebarOpen }: ChurchModuleProps) {
  switch (activePage) {
    case "library":
    case "sermons":      // Fallback for legacy links/state
    case "bible-studies": // Fallback for legacy links/state
      return <LibraryPage setSidebarOpen={setSidebarOpen} />
    case "events":
      return <EventsPage setSidebarOpen={setSidebarOpen} />
    case "announcements":
      return <AnnouncementsPage setSidebarOpen={setSidebarOpen} />
    case "ministries":
      return <MinistriesPage setSidebarOpen={setSidebarOpen} />
    case "media":
    case "google-photos":
      return <MediaPage />
    case "photos": // Keep for backward compatibility if needed
      return <MediaPage />
    case "church-profile":
    case "profile":
      return <ChurchProfilePage />
    default:
      return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="rounded-xl bg-muted/50 p-10 text-center">
            <h2 className="text-2xl font-bold capitalize">{activePage.replace("-", " ")}</h2>
            <p className="text-muted-foreground">This section is currently under development.</p>
          </div>
        </div>
      )
  }
}
