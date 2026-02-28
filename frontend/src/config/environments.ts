export const environments = [
  { value: "development", label: "Development", color: "bg-blue-500" },
  { value: "staging", label: "Staging", color: "bg-yellow-500" },
  { value: "production", label: "Production", color: "bg-red-500" },
  { value: "custom", label: "Custom", color: "bg-gray-500" },
] as const;

export type Environment = (typeof environments)[number]["value"];

export function getEnvironmentConfig(value: string) {
  return environments.find((e) => e.value === value) ?? environments[3];
}
