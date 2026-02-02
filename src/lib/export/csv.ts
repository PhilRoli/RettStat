import type { TourRecord, VehicleRecord, ProfileRecord } from "@/lib/pocketbase/types";

interface TourWithExpand extends TourRecord {
  expand?: {
    vehicle?: VehicleRecord & {
      expand?: {
        vehicle_type?: { name: string; abbreviation?: string };
      };
    };
    shiftplan?: { date: string };
    driver?: ProfileRecord;
    lead?: ProfileRecord;
    student?: ProfileRecord;
  };
}

export function generateShiftsCSV(
  tours: TourWithExpand[],
  options: {
    includeHeader?: boolean;
    delimiter?: string;
    dateFormat?: "ISO" | "DE" | "US";
  } = {}
): string {
  const { includeHeader = true, delimiter = ",", dateFormat = "DE" } = options;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (dateFormat) {
      case "ISO":
        return date.toISOString().split("T")[0];
      case "US":
        return date.toLocaleDateString("en-US");
      case "DE":
      default:
        return date.toLocaleDateString("de-DE");
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeCSV = (value: string | undefined | null): string => {
    if (!value) return "";
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = ["Date", "Start", "End", "Vehicle", "Type", "Driver", "Lead", "Student", "Notes"];

  const rows = tours.map((tour) => [
    escapeCSV(formatDate(tour.expand?.shiftplan?.date || tour.created)),
    escapeCSV(formatTime(tour.start_time)),
    escapeCSV(formatTime(tour.end_time)),
    escapeCSV(tour.expand?.vehicle?.call_sign || ""),
    escapeCSV(tour.expand?.vehicle?.expand?.vehicle_type?.abbreviation || ""),
    escapeCSV(
      tour.expand?.driver ? `${tour.expand.driver.first_name} ${tour.expand.driver.last_name}` : ""
    ),
    escapeCSV(
      tour.expand?.lead ? `${tour.expand.lead.first_name} ${tour.expand.lead.last_name}` : ""
    ),
    escapeCSV(
      tour.expand?.student
        ? `${tour.expand.student.first_name} ${tour.expand.student.last_name}`
        : ""
    ),
    escapeCSV(tour.notes || ""),
  ]);

  const lines: string[] = [];
  if (includeHeader) {
    lines.push(headers.join(delimiter));
  }
  rows.forEach((row) => lines.push(row.join(delimiter)));

  return lines.join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate summary statistics CSV
export function generateStatsSummaryCSV(
  stats: {
    totalShifts: number;
    thisMonth: number;
    avgPerMonth: number;
    byVehicleType: { name: string; count: number }[];
  },
  year: number
): string {
  const lines: string[] = [];

  lines.push("RettStat Shift Statistics");
  lines.push(`Year,${year}`);
  lines.push("");
  lines.push("Summary");
  lines.push(`Total Shifts,${stats.totalShifts}`);
  lines.push(`This Month,${stats.thisMonth}`);
  lines.push(`Average per Month,${stats.avgPerMonth.toFixed(1)}`);
  lines.push("");
  lines.push("By Vehicle Type");
  lines.push("Type,Count");
  stats.byVehicleType.forEach((item) => {
    lines.push(`${item.name},${item.count}`);
  });

  return lines.join("\n");
}
