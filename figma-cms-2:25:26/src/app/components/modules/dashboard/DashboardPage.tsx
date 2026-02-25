import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Users, Mic2, Heart, TrendingUp } from "lucide-react"

export function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">+180 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sermons Published</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+4 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Giving</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 happening this week</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-8">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">New sermon uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      "Walking in Faith" by Pastor John Doe
                    </p>
                  </div>
                  <div className="ml-auto font-medium">Just now</div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">New member registered</p>
                    <p className="text-sm text-muted-foreground">
                      Sarah Williams joined the community
                    </p>
                  </div>
                  <div className="ml-auto font-medium">2 hours ago</div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Event updated</p>
                    <p className="text-sm text-muted-foreground">
                      "Youth Summer Camp" details modified
                    </p>
                  </div>
                  <div className="ml-auto font-medium">5 hours ago</div>
                </div>
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <div className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted cursor-pointer transition-colors">
                    <Mic2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Upload Sermon</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted cursor-pointer transition-colors">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Member</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted cursor-pointer transition-colors">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-medium">Record Donation</span>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
