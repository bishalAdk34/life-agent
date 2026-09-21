export interface Token {
  access_token: string;
  token_type: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Interest {
  id: string;
  label: string;
  created_at: string;
}

export type GoalStatus = "active" | "paused" | "done";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "pending" | "completed" | "skipped" | "rescheduled";

export interface Task {
  id: string;
  routine_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  scheduled_for: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  title: string;
  description: string | null;
  scheduled_time: string;
  days_of_week: number[];
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ActivitySource = "manual" | "suggested";

export interface Activity {
  id: string;
  title: string;
  category: string;
  duration_minutes: number | null;
  occurred_at: string;
  source: ActivitySource;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: string;
  currency: string;
  category: string;
  description: string | null;
  occurred_at: string;
  created_at: string;
}

export type BudgetPeriod = "daily" | "weekly" | "monthly";

export interface Budget {
  id: string;
  category: string | null;
  period: BudgetPeriod;
  amount_limit: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant" | "tool";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
}
