import { QuickLinks, NextShifts, NewsFeed } from "@/components/home";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <QuickLinks />

      {/* Next Shifts */}
      <NextShifts />

      {/* News Feed */}
      <NewsFeed />
    </div>
  );
}
