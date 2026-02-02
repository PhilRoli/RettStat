"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Car, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";

type Tour = Database["public"]["Tables"]["tours"]["Row"] & {
  shiftplan: {
    unit: {
      name: string;
    };
  } | null;
  vehicle: {
    call_sign: string;
  } | null;
  tour_type: {
    name: string;
  } | null;
};

export function NextShifts() {
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("home.nextShifts");

  useEffect(() => {
    if (user) {
      loadNextShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNextShifts = async () => {
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("tours")
        .select(
          `
          *,
          shiftplan:shiftplans!inner (
            unit:units (
              name
            )
          ),
          vehicle:vehicles (
            call_sign
          ),
          tour_type:tour_types (
            name
          )
        `
        )
        .gte("end_time", now)
        .or(`driver_id.eq.${user?.id},lead_id.eq.${user?.id},student_id.eq.${user?.id}`)
        .order("start_time", { ascending: true })
        .limit(3);

      if (error) throw error;
      setTours((data as Tour[]) || []);
    } catch (error) {
      console.error("Error loading next shifts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPosition = (tour: Tour) => {
    if (tour.driver_id === user?.id) return t("driver");
    if (tour.lead_id === user?.id) return t("lead");
    if (tour.student_id === user?.id) return t("student");
    return "";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (tours.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noShifts")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href="/shiftplan"
              className="hover:bg-accent block rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getPosition(tour)}</Badge>
                    {tour.tour_type && (
                      <span className="text-sm font-medium">{tour.tour_type.name}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(tour.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTime(tour.start_time)} - {formatTime(tour.end_time)}
                      </span>
                    </div>
                  </div>
                  {tour.shiftplan?.unit && (
                    <p className="text-muted-foreground text-sm">{tour.shiftplan.unit.name}</p>
                  )}
                </div>
                {tour.vehicle && (
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Car className="h-4 w-4" />
                    <span>{tour.vehicle.call_sign}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
