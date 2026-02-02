import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Users, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to RettStat</h1>
        <p className="text-muted-foreground mt-2">
          EMS Shift Management System - Your central hub for shift plans, statistics, and events.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Shift</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tomorrow</div>
            <p className="text-muted-foreground text-xs">08:00 - 16:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Shifts</div>
            <p className="text-muted-foreground text-xs">96 hours total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-xs">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year Total</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847 hrs</div>
            <p className="text-muted-foreground text-xs">+12% from last year</p>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            View Shift Plan
          </Button>
          <Button variant="secondary">
            <Users className="mr-2 h-4 w-4" />
            Browse Events
          </Button>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistics
          </Button>
        </div>
      </section>

      {/* News Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">News & Announcements</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Maintenance</CardTitle>
            <CardDescription>Posted 2 days ago</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              The system will undergo scheduled maintenance on Sunday from 02:00 to 04:00. During
              this time, some features may be temporarily unavailable.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
