import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Calendar, BarChart3, Users, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md font-bold">
              R
            </div>
            <span className="text-xl font-bold">RettStat</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to RettStat</h1>
          <p className="text-muted-foreground mt-2">
            EMS Shift Management System - Your central hub for shift plans, statistics, and events.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <section className="mb-8">
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

        {/* Color Palette Demo (Dev only - remove later) */}
        <section className="mt-12 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Design System Colors</h2>
          <div className="flex flex-wrap gap-2">
            <div className="bg-primary h-12 w-12 rounded-md" title="Primary" />
            <div className="bg-accent-cyan h-12 w-12 rounded-md" title="Cyan" />
            <div className="bg-accent-blue h-12 w-12 rounded-md" title="Blue" />
            <div className="bg-accent-purple h-12 w-12 rounded-md" title="Purple" />
            <div className="bg-accent-magenta h-12 w-12 rounded-md" title="Magenta" />
            <div className="bg-accent-orange h-12 w-12 rounded-md" title="Orange" />
            <div className="bg-accent-yellow h-12 w-12 rounded-md" title="Yellow" />
            <div className="bg-accent-green h-12 w-12 rounded-md" title="Green" />
            <div className="bg-accent-teal h-12 w-12 rounded-md" title="Teal" />
            <div className="bg-accent-dark-teal h-12 w-12 rounded-md" title="Dark Teal" />
            <div className="bg-accent-forest h-12 w-12 rounded-md" title="Forest" />
          </div>
        </section>
      </main>
    </div>
  );
}
