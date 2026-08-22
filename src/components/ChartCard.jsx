import {
  ArcElement, CategoryScale, Chart as ChartJS, Filler,
  Legend, LinearScale, LineElement, PointElement, Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Filler, Tooltip, Legend
);

const LINE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 7,
        boxHeight: 7,
        padding: 18,
        font: { family: "Plus Jakarta Sans", size: 12, weight: "500" },
        color: "#94a3b8",
      },
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleFont: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
      bodyFont:  { family: "Inter", size: 12 },
      padding: 14,
      cornerRadius: 12,
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 5,
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      grid: { color: "rgba(148,163,184,0.08)", drawBorder: false },
      ticks: {
        font: { family: "Inter", size: 11 },
        color: "#94a3b8",
        padding: 8,
      },
      border: { display: false },
    },
    x: {
      grid: { display: false, drawBorder: false },
      ticks: {
        font: { family: "Inter", size: 11 },
        color: "#94a3b8",
        padding: 4,
      },
      border: { display: false },
    },
  },
};

const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 7,
        boxHeight: 7,
        padding: 18,
        font: { family: "Plus Jakarta Sans", size: 12, weight: "500" },
        color: "#94a3b8",
      },
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleFont: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
      bodyFont:  { family: "Inter", size: 12 },
      padding: 12,
      cornerRadius: 10,
      borderColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
    },
  },
};

// Default empty chart data structure
const EMPTY_CHART_DATA = {
  labels: [],
  datasets: [],
};

function CardShell({ title, subtitle, action, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function LineChartCard({ title, subtitle, data, action }) {
  // Ensure data always has valid structure
  const chartData = useMemo(() => {
    if (!data || typeof data !== 'object') return EMPTY_CHART_DATA;
    if (!Array.isArray(data.labels)) return { ...EMPTY_CHART_DATA, datasets: data.datasets || [] };
    if (!Array.isArray(data.datasets)) return { ...EMPTY_CHART_DATA, labels: data.labels };
    return data;
  }, [data]);

  return (
    <CardShell title={title} subtitle={subtitle} action={action}>
      <div style={{ height: 280 }}>
        <Line data={chartData} options={LINE_OPTIONS} />
      </div>
    </CardShell>
  );
}

export function DoughnutChartCard({ title, subtitle, data, action }) {
  // Ensure data always has valid structure
  const chartData = useMemo(() => {
    if (!data || typeof data !== 'object') return EMPTY_CHART_DATA;
    if (!Array.isArray(data.labels)) return { ...EMPTY_CHART_DATA, datasets: data.datasets || [] };
    if (!Array.isArray(data.datasets)) return { ...EMPTY_CHART_DATA, labels: data.labels };
    return data;
  }, [data]);

  return (
    <CardShell title={title} subtitle={subtitle} action={action}>
      <div style={{ height: 280 }}>
        <Doughnut data={chartData} options={DOUGHNUT_OPTIONS} />
      </div>
    </CardShell>
  );
}