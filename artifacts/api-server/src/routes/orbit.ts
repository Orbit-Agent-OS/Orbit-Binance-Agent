import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  AnalyzeMarketBody,
  ExecuteAgentActionBody,
  ExecuteAgentActionResponse,
  GetDashboardResponse,
  GetMarketSnapshotQueryParams,
  GetMarketSnapshotResponse,
  GetPolicyResponse,
  GetPortfolioResponse,
  ListActivityQueryParams,
  ListActivityResponse,
  UpdatePolicyBody,
  UpdatePolicyResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  orbitActivity,
  orbitAgentRuns,
  orbitPolicies,
} from "@workspace/db/schema";

const router: IRouter = Router();
let seedPromise: Promise<void> | undefined;

const DEMO_BALANCE = 107_842.36;
const DEFAULT_POLICY = {
  id: 1,
  maxTradeSize: "1000",
  maxLeverage: "2",
  dailyLossLimit: "500",
  requireConfirmation: true,
  allowedSymbols: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
  withdrawalsBlocked: true,
};

const demoActivity = [
  {
    kind: "sync",
    title: "Agentic account synced",
    detail: "Balances and open positions verified through Binance MCP",
    status: "completed",
    symbol: null,
  },
  {
    kind: "policy",
    title: "Risk policy active",
    detail: "Confirmation gate and 2× leverage ceiling are protecting capital",
    status: "completed",
    symbol: null,
  },
  {
    kind: "analysis",
    title: "BTC market scan completed",
    detail: "Momentum building · 82% confidence · awaiting your decision",
    status: "awaiting",
    symbol: "BTCUSDT",
  },
];

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function relativeTime(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function ensureSeedData() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const policy = await db
        .select({ id: orbitPolicies.id })
        .from(orbitPolicies)
        .where(eq(orbitPolicies.id, 1))
        .limit(1);

      if (policy.length === 0) {
        await db.insert(orbitPolicies).values(DEFAULT_POLICY);
      }

      const activity = await db
        .select({ id: orbitActivity.id })
        .from(orbitActivity)
        .limit(1);

      if (activity.length === 0) {
        await db.insert(orbitActivity).values(demoActivity);
      }
    })();
  }
  return seedPromise;
}

function marketFor(symbol: string) {
  if (symbol === "ETHUSDT") {
    return {
      symbol,
      price: 4_182.63,
      change24h: 2.14,
      volatility: 38.2,
      trend: "bullish" as const,
      signal: "Structure holding",
      confidence: 76,
      support: 4_020,
      resistance: 4_320,
      volume24h: 12.8,
      candles: [46, 49, 47, 54, 52, 56, 61, 58, 64, 66, 62, 70, 73, 77, 74, 82, 85],
    };
  }

  return {
    symbol: "BTCUSDT",
    price: 109_482.2,
    change24h: 3.84,
    volatility: 32.7,
    trend: "bullish" as const,
    signal: "Momentum building",
    confidence: 82,
    support: 106_900,
    resistance: 111_800,
    volume24h: 28.4,
    candles: [48, 45, 50, 47, 54, 53, 58, 56, 62, 59, 68, 65, 71, 75, 72, 81, 86, 84, 91],
  };
}

function mapPolicy(policy: typeof DEFAULT_POLICY | (typeof orbitPolicies.$inferSelect)) {
  return GetPolicyResponse.parse({
    maxTradeSize: numberValue(policy.maxTradeSize),
    maxLeverage: numberValue(policy.maxLeverage),
    dailyLossLimit: numberValue(policy.dailyLossLimit),
    requireConfirmation: policy.requireConfirmation,
    allowedSymbols: policy.allowedSymbols,
    withdrawalsBlocked: policy.withdrawalsBlocked,
  });
}

async function getActivePolicy() {
  await ensureSeedData();
  const [policy] = await db
    .select()
    .from(orbitPolicies)
    .where(eq(orbitPolicies.id, 1))
    .limit(1);
  return policy ?? DEFAULT_POLICY;
}

router.get("/dashboard", async (req, res) => {
  try {
    const policy = await getActivePolicy();
    const data = GetDashboardResponse.parse({
      mode: "demo",
      liveStatus: "demo",
      balance: DEMO_BALANCE,
      dayPnl: 1284.62,
      dayPnlPercent: 1.21,
      riskScore: 24,
      riskLabel: "Well protected",
      activePositions: 2,
      protectedCapital: 96.4,
      policyStatus: `${policy.maxLeverage}× leverage ceiling active`,
      lastSyncedAt: "12 seconds ago",
      topSymbol: "BTCUSDT",
      topSymbolChange: 3.84,
    });
    res.json(data);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load Orbit dashboard");
    res.status(500).json({ error: "Unable to load dashboard" });
  }
});

router.get("/market/snapshot", async (req, res) => {
  try {
    const params = GetMarketSnapshotQueryParams.parse(req.query);
    res.json(GetMarketSnapshotResponse.parse(marketFor(params.symbol)));
  } catch (error) {
    req.log.error({ err: error }, "Failed to load market snapshot");
    res.status(400).json({ error: "Invalid market symbol" });
  }
});

router.get("/portfolio", async (req, res) => {
  try {
    res.json(
      GetPortfolioResponse.parse({
        totalValue: DEMO_BALANCE,
        availableCash: 82_460.12,
        unrealizedPnl: 1842.76,
        leverage: 1.18,
        concentration: 42,
        assets: [
          { asset: "USDT", value: 82_460.12, allocation: 76.5, change: 0, tone: "green" },
          { asset: "BTC", value: 18_346.84, allocation: 17.0, change: 3.84, tone: "gold" },
          { asset: "ETH", value: 5_912.32, allocation: 5.5, change: 2.14, tone: "blue" },
          { asset: "BNB", value: 1_123.08, allocation: 1.0, change: -0.42, tone: "purple" },
        ],
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to load portfolio");
    res.status(500).json({ error: "Unable to load portfolio" });
  }
});

router.get("/activity", async (req, res) => {
  try {
    await ensureSeedData();
    const { limit } = ListActivityQueryParams.parse(req.query);
    const entries = await db
      .select()
      .from(orbitActivity)
      .orderBy(desc(orbitActivity.createdAt))
      .limit(limit);
    res.json(
      ListActivityResponse.parse(
        entries.map((entry) => ({
          id: entry.id,
          kind: entry.kind,
          title: entry.title,
          detail: entry.detail,
          time: relativeTime(entry.createdAt),
          status: entry.status,
          symbol: entry.symbol,
        })),
      ),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to load Orbit activity");
    res.status(500).json({ error: "Unable to load activity" });
  }
});

router.get("/policy", async (req, res) => {
  try {
    res.json(mapPolicy(await getActivePolicy()));
  } catch (error) {
    req.log.error({ err: error }, "Failed to load Orbit policy");
    res.status(500).json({ error: "Unable to load policy" });
  }
});

router.patch("/policy", async (req, res) => {
  try {
    await ensureSeedData();
    const body = UpdatePolicyBody.parse(req.body);
    const [updated] = await db
      .update(orbitPolicies)
      .set({
        maxTradeSize: String(body.maxTradeSize),
        maxLeverage: String(body.maxLeverage),
        dailyLossLimit: String(body.dailyLossLimit),
        requireConfirmation: body.requireConfirmation,
        allowedSymbols: body.allowedSymbols,
        updatedAt: new Date(),
      })
      .where(eq(orbitPolicies.id, 1))
      .returning();

    await db.insert(orbitActivity).values({
      kind: "policy",
      title: "Risk policy updated",
      detail: `Trade cap $${body.maxTradeSize.toLocaleString()} · ${body.maxLeverage}× leverage · confirmation ${body.requireConfirmation ? "on" : "off"}`,
      status: "completed",
      symbol: null,
    });

    res.json(UpdatePolicyResponse.parse(mapPolicy(updated ?? DEFAULT_POLICY)));
  } catch (error) {
    req.log.error({ err: error }, "Failed to update Orbit policy");
    res.status(400).json({ error: "Unable to update policy" });
  }
});

router.post("/agent/analyze", async (req, res) => {
  try {
    const body = AnalyzeMarketBody.parse(req.body);
    const policy = await getActivePolicy();
    const market = marketFor(body.symbol);
    const action = body.intent === "observe" ? "hold" : body.prompt.toLowerCase().includes("sell") ? "sell" : "buy";
    const side = action === "buy" ? "LONG" : action === "sell" ? "SHORT" : "FLAT";
    const notional = action === "hold" ? 0 : Math.min(numberValue(policy.maxTradeSize), 750);
    const status = policy.allowedSymbols.includes(market.symbol) && notional <= numberValue(policy.maxTradeSize) ? "ready" : "blocked";
    const stop = action === "sell" ? market.price * 1.018 : market.price * 0.982;
    const target = action === "sell" ? market.price * 0.961 : market.price * 1.039;
    const [run] = await db
      .insert(orbitAgentRuns)
      .values({
        symbol: market.symbol,
        headline: action === "hold" ? `${market.symbol} is in observation mode` : `${market.symbol} setup passes the first safety gates`,
        thesis: `${market.signal} with ${market.change24h.toFixed(2)}% 24h movement. Orbit sees a ${market.trend} structure, but sizing stays bounded and the action remains yours to confirm.`,
        action,
        side,
        notional: String(notional),
        entry: String(market.price),
        stop: String(stop),
        target: String(target),
        confidence: market.confidence,
        riskScore: status === "ready" ? 24 : 78,
        checks: [
          `Signal: ${market.signal} · ${market.confidence}% confidence`,
          `Size: $${notional.toLocaleString()} · below your $${numberValue(policy.maxTradeSize).toLocaleString()} cap`,
          `Protection: stop ${action === "hold" ? "not applicable" : `${Math.abs((stop / market.price - 1) * 100).toFixed(1)}% away`}`,
          policy.requireConfirmation ? "Gate: your confirmation is required before execution" : "Gate: policy confirmation is disabled",
        ],
        status,
      })
      .returning();

    await db.insert(orbitActivity).values({
      kind: status === "blocked" ? "blocked" : "analysis",
      title: status === "blocked" ? "Action blocked by policy" : "New market analysis ready",
      detail: `${market.symbol} · ${action.toUpperCase()} · ${market.confidence}% confidence · awaiting your decision`,
      status: status === "blocked" ? "blocked" : "awaiting",
      symbol: market.symbol,
    });

    res.json({
      id: run.id,
      symbol: run.symbol,
      headline: run.headline,
      thesis: run.thesis,
      action: run.action,
      side: run.side,
      notional: numberValue(run.notional),
      entry: numberValue(run.entry),
      stop: numberValue(run.stop),
      target: numberValue(run.target),
      confidence: run.confidence,
      riskScore: run.riskScore,
      checks: run.checks,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to analyze market");
    res.status(400).json({ error: "Unable to analyze this request" });
  }
});

router.post("/agent/execute", async (req, res) => {
  try {
    await ensureSeedData();
    const body = ExecuteAgentActionBody.parse(req.body);
    const policy = await getActivePolicy();
    const [run] = await db
      .select()
      .from(orbitAgentRuns)
      .where(and(eq(orbitAgentRuns.id, body.runId)))
      .limit(1);

    if (!run) {
      res.status(404).json({ error: "Analysis run not found" });
      return;
    }
    if (!body.confirmation || (policy.requireConfirmation && !body.confirmation)) {
      res.status(400).json({ error: "Confirmation is required before execution" });
      return;
    }
    if (run.status === "blocked") {
      res.status(400).json({ error: "This action is blocked by the active policy" });
      return;
    }

    const [executed] = await db
      .update(orbitAgentRuns)
      .set({ status: "executed" })
      .where(eq(orbitAgentRuns.id, body.runId))
      .returning();
    const orderId = `ORBIT-${String(body.runId).padStart(5, "0")}`;
    const [activity] = await db
      .insert(orbitActivity)
      .values({
        kind: "execution",
        title: "Confirmed action executed",
        detail: `${run.action.toUpperCase()} ${run.symbol} · $${numberValue(run.notional).toLocaleString()} notional · Agentic sub-account`,
        status: "completed",
        symbol: run.symbol,
      })
      .returning();

    res.json(
      ExecuteAgentActionResponse.parse({
        success: true,
        message: "Action executed in demo mode. In live mode, this step calls the Binance MCP confirmation flow.",
        orderId,
        filledPrice: numberValue(executed?.entry ?? run.entry),
        notional: numberValue(run.notional),
        riskAfter: 28,
        activity: {
          id: activity.id,
          kind: activity.kind,
          title: activity.title,
          detail: activity.detail,
          time: "just now",
          status: activity.status,
          symbol: activity.symbol,
        },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to execute Orbit action");
    res.status(400).json({ error: "Unable to execute this action" });
  }
});

export default router;