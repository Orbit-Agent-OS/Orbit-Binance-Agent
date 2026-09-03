import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const orbitPolicies = pgTable("orbit_policies", {
  id: integer("id").primaryKey(),
  maxTradeSize: numeric("max_trade_size").notNull(),
  maxLeverage: numeric("max_leverage").notNull(),
  dailyLossLimit: numeric("daily_loss_limit").notNull(),
  requireConfirmation: boolean("require_confirmation").notNull(),
  allowedSymbols: jsonb("allowed_symbols").$type<string[]>().notNull(),
  withdrawalsBlocked: boolean("withdrawals_blocked").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orbitAgentRuns = pgTable("orbit_agent_runs", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  headline: text("headline").notNull(),
  thesis: text("thesis").notNull(),
  action: text("action").notNull(),
  side: text("side").notNull(),
  notional: numeric("notional").notNull(),
  entry: numeric("entry").notNull(),
  stop: numeric("stop").notNull(),
  target: numeric("target").notNull(),
  confidence: integer("confidence").notNull(),
  riskScore: integer("risk_score").notNull(),
  checks: jsonb("checks").$type<string[]>().notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orbitActivity = pgTable("orbit_activity", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  status: text("status").notNull(),
  symbol: text("symbol"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});