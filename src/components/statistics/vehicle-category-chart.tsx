"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { useTranslations } from "next-intl";
import type { VehicleTypeStat } from "@/hooks/use-statistics";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VehicleCategoryChartProps {
  data: VehicleTypeStat[];
}

// Default colors if vehicle type doesn't have a color
const defaultColors = [
  "#b70e0c", // Primary red
  "#0065a0", // Blue
  "#f29400", // Orange
  "#2c9155", // Forest green
  "#6f69a3", // Purple
  "#00acc1", // Cyan
  "#a66da7", // Magenta
  "#ebbd00", // Yellow
];

export function VehicleCategoryChart({ data }: VehicleCategoryChartProps) {
  const t = useTranslations("statistics");

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center">
        {t("noVehicleData")}
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: t("shifts"),
        data: data.map((d) => d.count),
        backgroundColor: data.map((d, i) => d.color || defaultColors[i % defaultColors.length]),
        borderRadius: 4,
        maxBarThickness: 50,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x ?? 0;
            return `${value} ${value === 1 ? t("shift") : t("shifts")}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
        },
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-[200px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
