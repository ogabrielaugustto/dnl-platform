import type { MonitoringRuleFrequency } from "@/lib/dal/assets";

export const monitoringFrequencyOptions: Array<{
  value: MonitoringRuleFrequency;
  label: string;
}> = [
  { value: "hourly", label: "A cada hora" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
];

export function formatMonitoringFrequency(value: MonitoringRuleFrequency | null) {
  return (
    monitoringFrequencyOptions.find((option) => option.value === value)?.label ??
    "Diariamente"
  );
}
