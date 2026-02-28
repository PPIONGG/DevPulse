export const nodeTypes = [
  {
    type: "http_request",
    label: "HTTP Request",
    description: "Make an HTTP request to an external API",
    color: "bg-blue-500",
    icon: "Globe",
  },
  {
    type: "delay",
    label: "Delay",
    description: "Wait for a specified number of seconds",
    color: "bg-yellow-500",
    icon: "Clock",
  },
  {
    type: "condition",
    label: "Condition",
    description: "Check a condition on previous output",
    color: "bg-purple-500",
    icon: "GitBranch",
  },
  {
    type: "transform",
    label: "Transform",
    description: "Pass through data from previous step",
    color: "bg-green-500",
    icon: "Shuffle",
  },
  {
    type: "notify",
    label: "Notify",
    description: "Log a notification message",
    color: "bg-orange-500",
    icon: "Bell",
  },
] as const;

export type NodeType = (typeof nodeTypes)[number]["type"];

export function getNodeConfig(type: string) {
  return nodeTypes.find((n) => n.type === type) ?? nodeTypes[0];
}

export const triggerTypes = [
  { value: "manual", label: "Manual", description: "Trigger manually via button", disabled: false },
  { value: "webhook", label: "Webhook", description: "Trigger via HTTP webhook URL", disabled: false },
  { value: "cron", label: "Cron (coming soon)", description: "Schedule with cron expression", disabled: true },
] as const;

export type TriggerType = (typeof triggerTypes)[number]["value"];

export const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export const conditionOperators = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
] as const;

export interface WorkflowNodeData {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, unknown>;
}

export function createDefaultNodeConfig(type: NodeType): Record<string, unknown> {
  switch (type) {
    case "http_request":
      return { method: "GET", url: "", headers: {}, body: "" };
    case "delay":
      return { seconds: 5 };
    case "condition":
      return { field: "", operator: "equals", value: "" };
    case "transform":
      return {};
    case "notify":
      return { message: "" };
    default:
      return {};
  }
}
