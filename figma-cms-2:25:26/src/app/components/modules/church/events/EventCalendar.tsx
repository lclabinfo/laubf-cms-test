"use client"

import { useState } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  set
} from "date-fns"
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Calendar as CalendarIcon, Edit, ExternalLink } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/components/ui/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/app/components/ui/dialog"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"

// Define interface locally to avoid circular dependencies
export interface CalendarEvent {
  id: string
  title: string
  date: string // ISO string
  location: string
  type: "Event" | "Meeting" | "Program"
  status: "published" | "draft" | "archived"
  registrations: number
  ministry?: string
  description?: string
}

interface EventCalendarProps {
  events: CalendarEvent[]
  onEditEvent: (id: string) => void
}

export function EventCalendar({ events, onEditEvent }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const onToday = () => setCurrentMonth(new Date())

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between py-4">
        <h2 className="text-2xl font-bold text-foreground pl-1">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onToday} className="h-8">
                Today
            </Button>
            <Button variant="outline" size="icon" onClick={onNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const dateFormat = "EEE"
    const days = []
    let startDate = startOfWeek(currentMonth)

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center py-3 border-b border-border bg-muted/5" key={i}>
          {format(addMonths(startDate, i /* hack to add days? no, addDays is better but loop index works if startDate is fixed */), dateFormat)}
           {/* Wait, startOfWeek gives Sunday. I need to iterate days. */}
           {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][i]}
        </div>
      )
    }

    return <div className="grid grid-cols-7 border-t border-l border-border rounded-tl-md rounded-tr-md overflow-hidden">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    const dayList = eachDayOfInterval({ start: startDate, end: endDate })

    dayList.forEach((dayItem, index) => {
        const isCurrentMonth = isSameMonth(dayItem, monthStart)
        const isDayToday = isToday(dayItem)
        const dateKey = format(dayItem, "yyyy-MM-dd")
        
        // Find events for this day
        const dayEvents = events.filter(event => {
            return isSameDay(parseISO(event.date), dayItem)
        })

        days.push(
            <div
                key={dayItem.toString()}
                className={cn(
                    "min-h-[120px] border-b border-r border-border p-2 transition-colors hover:bg-muted/5 relative group",
                    !isCurrentMonth && "bg-muted/10 text-muted-foreground/50"
                )}
            >
                <div className="flex justify-between items-start">
                    <span 
                        className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                            isDayToday 
                                ? "bg-blue-600 text-white" 
                                : "text-muted-foreground group-hover:text-foreground"
                        )}
                    >
                        {format(dayItem, "d")}
                    </span>
                </div>
                
                <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.map((event) => {
                        // Determine color based on some logic (e.g. type)
                        const isBlue = event.type === 'Event' || event.ministry === 'Worship';
                        const bgColor = isBlue ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20";
                        const borderColor = isBlue ? "border-blue-500" : "border-orange-500";
                        const textColor = isBlue ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300";

                        return (
                            <button
                                key={event.id}
                                onClick={() => {
                                    setSelectedEvent(event)
                                    setIsDialogOpen(true)
                                }}
                                className={cn(
                                    "text-left text-[10px] font-medium px-2 py-1 rounded-sm border-l-[3px] truncate w-full transition-all hover:brightness-95",
                                    bgColor,
                                    borderColor,
                                    textColor
                                )}
                            >
                                {format(parseISO(event.date), "h:mm a")} {event.title}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    })

    return <div className="grid grid-cols-7 border-l border-t border-border">{days}</div>
  }

  return (
    <div className="bg-card rounded-md border shadow-sm p-4">
      {renderHeader()}
      <div className="rounded-md border border-border overflow-hidden">
        {/* Day Headers */}
         <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground tracking-wider">
                    {day}
                </div>
            ))}
         </div>
         {/* Calendar Grid */}
         {renderCells()}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Badge variant={selectedEvent?.status === 'published' ? 'default' : 'secondary'}>
                    {selectedEvent?.status}
                </Badge>
                <span className="truncate">{selectedEvent?.title}</span>
            </DialogTitle>
            <DialogDescription>
                {selectedEvent?.type} • {selectedEvent?.ministry}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="grid gap-0.5">
                    <span className="font-medium">
                        {selectedEvent && format(parseISO(selectedEvent.date), "EEEE, MMMM d, yyyy")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {selectedEvent && format(parseISO(selectedEvent.date), "h:mm a")} - {selectedEvent && format(new Date(new Date(selectedEvent.date).getTime() + 90 * 60000), "h:mm a")}
                    </span>
                </div>
            </div>
            
            <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="grid gap-0.5">
                     <span className="font-medium">{selectedEvent?.location}</span>
                     <span className="text-sm text-muted-foreground">{selectedEvent?.location === 'Online' ? 'Join via link' : 'In-person'}</span>
                </div>
            </div>

            <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                    <span className="font-medium">{selectedEvent?.registrations}</span> people registered
                </span>
            </div>
            
            {selectedEvent?.description && (
                <div className="mt-2 text-sm text-muted-foreground border-l-2 pl-3 italic">
                    {selectedEvent.description}
                </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
                if (selectedEvent) onEditEvent(selectedEvent.id)
                setIsDialogOpen(false)
            }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
