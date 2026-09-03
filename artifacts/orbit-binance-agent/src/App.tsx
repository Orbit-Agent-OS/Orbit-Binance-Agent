import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Copy,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Play,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getGetMarketSnapshotQueryKey,
  getGetPolicyQueryKey,
  getGetPortfolioQueryKey,
  getListActivityQueryKey,
  useAnalyzeMarket,
  useExecuteAgentAction,
  useGetDashboard,
  useGetMarketSnapshot,
  useGetPolicy,
  useGetPortfolio,
  useListActivity,
  useUpdatePolicy,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const marketParams = { symbol: 'BTCUSDT' };
const activityParams = { limit: 20 };

const money = (value = 0, digits = 2) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits }).format(value);
const number = (value = 0, digits = 2) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
const percent = (value = 0) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const timeAgo = (value?: string) => {
  if (!value) return '—';
   if (value === 'just now' || value.includes('ago')) return value;
  const mins = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function AppLogo() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-orbit">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_7px_18px_hsl(45_97%_55%/.2)]">
        <span className="absolute h-5 w-5 rounded-full border-[1.5px] border-current" />
        <span className="absolute h-2 w-2 rounded-full bg-current" />
      </div>
      <div>
        <div className="font-bold tracking-[-0.03em] text-sidebar-accent-foreground">orbit</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/60">agent os</div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { href: '/', label: 'Command center', icon: LayoutDashboard },
    { href: '/activity', label: 'Activity log', icon: History },
    { href: '/policies', label: 'Execution policy', icon: ShieldCheck },
    { href: '/settings', label: 'Settings', icon: Settings2 },
  ];
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar px-4 py-5 transition-transform duration-300 md:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <AppLogo />
        <div className="mt-10 px-3 font-mono text-[10px] uppercase tracking-[0.17em] text-sidebar-foreground/45">workspace</div>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {links.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                data-testid={`link-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                className={cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-colors', active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground')}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-sidebar-foreground/60')} strokeWidth={1.8} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground/55">guardrail status</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#55c7a1] shadow-[0_0_10px_#55c7a1]" />
            </div>
            <div className="mt-2 text-[12px] font-semibold text-sidebar-accent-foreground">All systems bounded</div>
            <div className="mt-1 text-[10px] leading-relaxed text-sidebar-foreground/55">No action executes without your confirmation.</div>
          </div>
          <div className="flex items-center gap-2 border-t border-sidebar-border px-2 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#31405b] font-mono text-[11px] text-primary">AW</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-sidebar-accent-foreground">Alex Wong</div>
              <div className="font-mono text-[9px] text-sidebar-foreground/50">owner / read-write</div>
            </div>
            <button type="button" data-testid="button-account-menu" className="text-sidebar-foreground/50 hover:text-sidebar-accent-foreground"><SlidersHorizontal className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button type="button" aria-label="Close navigation" data-testid="button-close-navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-sidebar/30 md:hidden" />}
      <main className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button type="button" data-testid="button-open-navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu className="h-5 w-5" /></button>
            <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:flex"><span className="text-primary">orbit</span><ChevronRight className="h-3 w-3" /> {location === '/' ? 'command center' : location.slice(1)}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[10px] text-muted-foreground sm:flex"><Command className="h-3.5 w-3.5" /> <span>⌘ K</span></div>
            <button type="button" data-testid="button-notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"><Bell className="h-[17px] w-[17px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" /></button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="flex items-center gap-2 rounded-full bg-[#e7ecef] px-2 py-1 text-[10px] font-semibold text-foreground dark:bg-muted"><span className="h-1.5 w-1.5 rounded-full bg-[#55c7a1]" /> DEMO MODE</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function QueryState({ loading, error, onRetry, children }: { loading?: boolean; error?: unknown; onRetry: () => void; children: ReactNode }) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-28 w-full" /></div>;
  if (error) return <div className="flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-xs"><div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" /> Orbit could not reach this data source.</div><button type="button" data-testid="button-retry-query" onClick={onRetry} className="font-semibold text-destructive underline underline-offset-4">Retry</button></div>;
  return <>{children}</>;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</div><h2 className="mt-1 text-[17px] font-bold tracking-[-0.03em]">{title}</h2></div>{action}</div>;
}

function MetricCard({ label, value, detail, tone = 'neutral', icon: Icon }: { label: string; value: string; detail?: ReactNode; tone?: 'neutral' | 'positive' | 'warning'; icon: typeof Gauge }) {
  return <div className="orbit-panel rounded-xl border border-border bg-card p-4" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
    <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span><Icon className={cn('h-4 w-4', tone === 'positive' ? 'text-[#278f76]' : tone === 'warning' ? 'text-[#bc762d]' : 'text-muted-foreground')} strokeWidth={1.7} /></div>
    <div className="mt-4 text-[23px] font-bold tracking-[-0.05em]">{value}</div>
    {detail && <div className={cn('mt-1 text-[10px]', tone === 'positive' ? 'text-[#278f76]' : tone === 'warning' ? 'text-[#bc762d]' : 'text-muted-foreground')}>{detail}</div>}
  </div>;
}

function Sparkline({ values = [], positive = true }: { values?: number[]; positive?: boolean }) {
  const points = useMemo(() => {
    if (!values.length) return '';
    const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
    return values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${36 - ((v - min) / span) * 30}`).join(' ');
  }, [values]);
  return <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full"><polyline points={points} fill="none" stroke={positive ? '#2c9c82' : '#c96559'} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function TrendBadge({ value }: { value: number }) {
  return <span className={cn('inline-flex items-center gap-1 font-mono text-[10px] font-medium', value >= 0 ? 'text-[#278f76]' : 'text-[#c85f56]')}>{value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{percent(value)}</span>;
}

function ActivityRows({ items, compact = false }: { items: any[]; compact?: boolean }) {
  if (!items?.length) return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center"><History className="mb-2 h-5 w-5 text-muted-foreground/50" /><p className="text-xs font-semibold">No activity recorded</p><p className="mt-1 text-[10px] text-muted-foreground">Orbit will log every decision here.</p></div>;
  return <div className="divide-y divide-border">{items.slice(0, compact ? 5 : undefined).map((item, index) => {
    const iconMap: Record<string, typeof Activity> = { analysis: Sparkles, policy: ShieldCheck, execution: Zap, sync: RefreshCw, blocked: LockKeyhole };
    const Icon = iconMap[item.kind] || Activity;
    return <div key={item.id ?? index} className="group flex items-start gap-3 py-3.5 first:pt-0 last:pb-0" data-testid={`activity-row-${item.id ?? index}`}>
      <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', item.status === 'blocked' ? 'bg-destructive/10 text-destructive' : item.kind === 'execution' ? 'bg-primary/20 text-[#9f7610] dark:text-primary' : 'bg-muted text-muted-foreground')}><Icon className="h-3.5 w-3.5" strokeWidth={1.8} /></div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[12px] font-semibold">{item.title}</span>{item.symbol && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{item.symbol}</span>}</div><p className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</p></div>
      <div className="shrink-0 text-right"><div className="font-mono text-[9px] text-muted-foreground">{timeAgo(item.time)}</div><div className={cn('mt-1 text-[9px] font-semibold uppercase tracking-wider', item.status === 'blocked' ? 'text-destructive' : item.status === 'awaiting' ? 'text-[#bc762d]' : 'text-[#278f76]')}>{item.status}</div></div>
    </div>;
  })}</div>;
}

function Dashboard() {
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const market = useGetMarketSnapshot(marketParams, { query: { queryKey: getGetMarketSnapshotQueryKey(marketParams) } });
  const portfolio = useGetPortfolio({ query: { queryKey: getGetPortfolioQueryKey() } });
  const activity = useListActivity(activityParams, { query: { queryKey: getListActivityQueryKey(activityParams) } });
  const analyze = useAnalyzeMarket();
  const execute = useExecuteAgentAction();
  const [prompt, setPrompt] = useState('Assess BTC momentum and prepare a bounded trade only if the setup is asymmetric.');
  const [run, setRun] = useState<any>(null);
  const [executed, setExecuted] = useState<any>(null);
  const [notice, setNotice] = useState('');

  const handleAnalyze = () => {
    setNotice('');
    analyze.mutate({ data: { prompt, symbol: market.data?.symbol || 'BTCUSDT', intent: 'prepare' } }, { onSuccess: (result) => { setRun(result); setNotice('Analysis ready for your review.'); }, onError: () => setNotice('Analysis failed. No action was taken.') });
  };
  const handleExecute = () => {
    if (!run) return;
    execute.mutate({ data: { runId: run.id, confirmation: true } }, { onSuccess: (result) => { setExecuted(result); setNotice(result.success ? 'Action confirmed and logged.' : result.message); }, onError: () => setNotice('Execution was not completed. Your funds were not touched.') });
  };

  return <div className="orbit-rise space-y-7">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#278f76]"><span className="orbit-pulse h-1.5 w-1.5 rounded-full bg-[#55c7a1]" /> live command center</div><h1 className="mt-2 text-[29px] font-bold tracking-[-0.055em] md:text-[34px]">Good morning, Alex.</h1><p className="mt-1.5 max-w-xl text-[12px] text-muted-foreground">A quiet market is a good market to think. Orbit is watching the edges.</p></div><div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> last sync {timeAgo(dashboard.data?.lastSyncedAt)} <button type="button" data-testid="button-refresh-dashboard" onClick={() => { dashboard.refetch(); market.refetch(); portfolio.refetch(); activity.refetch(); }} className="ml-1 rounded-md border border-border p-1.5 text-foreground hover:bg-muted"><RefreshCw className="h-3 w-3" /></button></div></div>
    <QueryState loading={dashboard.isLoading} error={dashboard.error} onRetry={() => dashboard.refetch()}><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard label="Account balance" value={money(dashboard.data?.balance)} detail={<span>Available to protect</span>} tone="neutral" icon={Gauge} />
      <MetricCard label="Today's P&L" value={money(dashboard.data?.dayPnl)} detail={<TrendBadge value={dashboard.data?.dayPnlPercent || 0} />} tone={(dashboard.data?.dayPnl || 0) >= 0 ? 'positive' : 'warning'} icon={(dashboard.data?.dayPnl || 0) >= 0 ? TrendingUp : TrendingDown} />
      <MetricCard label="Risk posture" value={`${number(dashboard.data?.riskScore, 0)} / 100`} detail={<span>{dashboard.data?.riskLabel || 'Calibrating'}</span>} tone="positive" icon={ShieldCheck} />
       <MetricCard label="Protected capital" value={`${number(dashboard.data?.protectedCapital, 1)}%`} detail={<span>{dashboard.data?.activePositions || 0} active position{dashboard.data?.activePositions === 1 ? '' : 's'}</span>} tone="neutral" icon={LockKeyhole} />
    </div></QueryState>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(350px,.9fr)]">
       <section className="orbit-panel overflow-hidden rounded-xl border border-border bg-card">
         <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">market context / 24h</div><div className="mt-1 flex items-center gap-3"><h2 className="text-[17px] font-bold tracking-[-0.04em]">{market.data?.symbol || 'BTCUSDT'}</h2><TrendBadge value={market.data?.change24h || 0} /></div></div><div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-[9px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-[#55c7a1]" /> {market.data?.trend || 'neutral'} trend</div></div>
         <QueryState loading={market.isLoading} error={market.error} onRetry={() => market.refetch()}><div className="grid gap-5 p-5 md:grid-cols-[1fr_1.3fr]"><div><div className="font-mono text-[10px] text-muted-foreground">spot price</div><div className="mt-1 text-[30px] font-bold tracking-[-0.055em]" data-testid="text-market-price">{money(market.data?.price, 2)}</div><div className="mt-5 grid grid-cols-2 gap-3"><div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">support</div><div className="mt-1 text-[12px] font-semibold">{money(market.data?.support)}</div></div><div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">resistance</div><div className="mt-1 text-[12px] font-semibold">{money(market.data?.resistance)}</div></div><div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">volatility</div><div className="mt-1 text-[12px] font-semibold">{number(market.data?.volatility)}%</div></div><div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">volume</div><div className="mt-1 text-[12px] font-semibold">{number(market.data?.volume24h)}B USDT</div></div></div></div><div className="flex min-h-[150px] flex-col justify-end rounded-lg border border-border/70 bg-background/50 p-3 orbit-grid"><div className="mb-auto flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">price action</span><span className="font-mono text-[9px] text-muted-foreground">1D / 15m</span></div><Sparkline values={market.data?.candles} positive={(market.data?.change24h || 0) >= 0} /><div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground"><span>00:00</span><span>12:00</span><span>now</span></div></div></div></QueryState>
      </section>
       <section className="orbit-panel rounded-xl border border-border bg-card p-5"><SectionHeading eyebrow="portfolio" title="Exposure at a glance" action={<Link href="/policies" data-testid="link-view-policy" className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">view policy <ArrowRight className="ml-1 inline h-3 w-3" /></Link>} /><QueryState loading={portfolio.isLoading} error={portfolio.error} onRetry={() => portfolio.refetch()}><div className="mb-5 flex items-end justify-between"><div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">total value</div><div className="mt-1 text-[25px] font-bold tracking-[-0.05em]">{money(portfolio.data?.totalValue)}</div></div><div className="text-right"><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">unrealized</div><div className={cn('mt-1 text-[12px] font-semibold', (portfolio.data?.unrealizedPnl || 0) >= 0 ? 'text-[#278f76]' : 'text-destructive')}>{money(portfolio.data?.unrealizedPnl)}</div></div></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, portfolio.data?.concentration || 0)}%` }} /></div><div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>concentration {number(portfolio.data?.concentration || 0, 1)}%</span><span>{number(portfolio.data?.leverage)}× leverage</span></div><div className="mt-6 space-y-3">{portfolio.data?.assets?.slice(0, 4).map((asset: any, i: number) => <div key={asset.asset ?? i} className="flex items-center gap-3" data-testid={`asset-row-${asset.asset ?? i}`}><div className={cn('flex h-7 w-7 items-center justify-center rounded-full font-mono text-[9px] font-semibold', asset.tone === 'gold' ? 'bg-primary/25 text-[#98710d]' : asset.tone === 'blue' ? 'bg-[#dfe7f5] text-[#526d9d]' : asset.tone === 'green' ? 'bg-[#dcefe9] text-[#278f76]' : 'bg-[#e8e2f0] text-[#765894]')}>{asset.asset?.slice(0, 2)}</div><div className="flex-1"><div className="text-[11px] font-semibold">{asset.asset}</div><div className="mt-0.5 h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-foreground/30" style={{ width: `${Math.min(100, asset.allocation)}%` }} /></div></div><div className="text-right"><div className="font-mono text-[10px] font-medium">{money(asset.value, 0)}</div><TrendBadge value={asset.change} /></div></div>)}</div></QueryState></section>
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(390px,1.05fr)]">
      <section className="orbit-panel rounded-xl border border-border bg-card p-5"><SectionHeading eyebrow="agent activity" title="Recent decisions" action={<Link href="/activity" data-testid="link-open-activity" className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">open audit log <ArrowRight className="ml-1 inline h-3 w-3" /></Link>} /><QueryState loading={activity.isLoading} error={activity.error} onRetry={() => activity.refetch()}><ActivityRows items={activity.data || []} compact /></QueryState></section>
      <section className="orbit-panel relative overflow-hidden rounded-xl border border-sidebar-border bg-sidebar p-5 text-sidebar-accent-foreground"><div className="absolute -right-12 -top-14 h-44 w-44 rounded-full border border-primary/20" /><div className="absolute -right-5 -top-7 h-28 w-28 rounded-full border border-primary/10" /><div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary"><Sparkles className="h-3.5 w-3.5" /> orbit copilot</div><span className="rounded-full border border-sidebar-border px-2 py-1 font-mono text-[9px] text-sidebar-foreground/60">prepare mode</span></div><h2 className="mt-5 max-w-md text-[20px] font-bold leading-tight tracking-[-0.045em]">Ask clearly. Decide deliberately.</h2><p className="mt-2 max-w-md text-[11px] leading-relaxed text-sidebar-foreground/65">Orbit explains the setup, checks your policy, then waits for an explicit confirmation.</p><div className="mt-5 flex gap-2"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} data-testid="input-analysis-prompt" rows={2} className="min-h-[58px] flex-1 resize-none rounded-lg border border-sidebar-border bg-sidebar-accent/70 px-3 py-2.5 text-[11px] text-sidebar-accent-foreground outline-none placeholder:text-sidebar-foreground/35 focus:border-primary" placeholder="What should Orbit investigate?" /><button type="button" data-testid="button-analyze-market" onClick={handleAnalyze} disabled={analyze.isPending || !prompt.trim()} className="flex w-[92px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{analyze.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />} {analyze.isPending ? 'thinking' : 'analyze'}</button></div>{notice && <div className={cn('mt-3 text-[10px]', notice.includes('failed') || notice.includes('not') ? 'text-[#f4a39b]' : 'text-[#8ad3bd]')}>{notice}</div>}{run && <div className="mt-5 rounded-lg border border-sidebar-border bg-sidebar-accent/70 p-4 orbit-rise"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[9px] uppercase tracking-wider text-primary">{run.symbol} / {run.action} thesis</div><div className="mt-1 text-[13px] font-semibold">{run.headline}</div></div><span className={cn('rounded px-2 py-1 font-mono text-[9px] uppercase', run.status === 'blocked' ? 'bg-destructive/15 text-[#f4a39b]' : 'bg-[#55c7a1]/15 text-[#8ad3bd]')}>{run.status}</span></div><p className="mt-3 text-[10px] leading-relaxed text-sidebar-foreground/70">{run.thesis}</p><div className="mt-4 grid grid-cols-3 gap-2 border-y border-sidebar-border py-3"><div><div className="font-mono text-[8px] uppercase text-sidebar-foreground/45">notional</div><div className="mt-1 text-[11px] font-semibold">{money(run.notional, 0)}</div></div><div><div className="font-mono text-[8px] uppercase text-sidebar-foreground/45">confidence</div><div className="mt-1 text-[11px] font-semibold">{number(run.confidence, 0)}%</div></div><div><div className="font-mono text-[8px] uppercase text-sidebar-foreground/45">risk score</div><div className="mt-1 text-[11px] font-semibold">{number(run.riskScore, 0)} / 100</div></div></div><div className="mt-3 space-y-1.5">{run.checks?.slice(0, 3).map((check: string, i: number) => <div key={i} className="flex items-center gap-2 text-[10px] text-sidebar-foreground/70"><Check className="h-3 w-3 text-[#55c7a1]" /> {check}</div>)}</div><button type="button" data-testid="button-confirm-agent-action" onClick={handleExecute} disabled={execute.isPending || run.status === 'blocked' || !!executed} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/70 bg-primary/10 py-2.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">{execute.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : executed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}{execute.isPending ? 'confirming…' : executed ? 'action logged' : 'confirm bounded action'}</button></div>}{executed && <div className="mt-3 rounded-md bg-[#55c7a1]/10 px-3 py-2 font-mono text-[9px] text-[#8ad3bd]">Order {executed.orderId} · filled {money(executed.filledPrice)} · risk after {number(executed.riskAfter, 0)}/100</div>}</div></section>
    </div>
  </div>;
}

function ActivityPage() {
  const activity = useListActivity(activityParams, { query: { queryKey: getListActivityQueryKey(activityParams) } });
  const [filter, setFilter] = useState('all');
  const entries = (activity.data || []).filter((item: any) => filter === 'all' || item.kind === filter);
  const filters = ['all', 'analysis', 'policy', 'sync', 'blocked', 'execution'];
  return <div className="orbit-rise space-y-7"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#278f76]">immutable record</div><h1 className="mt-2 text-[30px] font-bold tracking-[-0.055em]">Activity log</h1><p className="mt-1.5 text-[12px] text-muted-foreground">Every analysis, boundary, and action — in one place.</p></div><button type="button" data-testid="button-refresh-activity" onClick={() => activity.refetch()} className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-[10px] font-semibold hover:bg-muted"><RefreshCw className="h-3.5 w-3.5" /> refresh log</button></div><div className="flex flex-wrap gap-2">{filters.map((item) => <button type="button" key={item} data-testid={`button-filter-${item}`} onClick={() => setFilter(item)} className={cn('rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors', filter === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{item}</button>)}</div><section className="orbit-panel rounded-xl border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-2 text-[12px] font-semibold"><Terminal className="h-4 w-4 text-primary" /> audit timeline</div><div className="font-mono text-[9px] text-muted-foreground">{entries.length} records · last 20</div></div><QueryState loading={activity.isLoading} error={activity.error} onRetry={() => activity.refetch()}><ActivityRows items={entries} /></QueryState></section></div>;
}

function PoliciesPage() {
  const policy = useGetPolicy({ query: { queryKey: getGetPolicyQueryKey() } });
  const update = useUpdatePolicy();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ maxTradeSize: '', maxLeverage: '', dailyLossLimit: '', requireConfirmation: true, allowedSymbols: '' });
  const [saved, setSaved] = useState('');
  useEffect(() => { if (policy.data) setForm({ maxTradeSize: String(policy.data.maxTradeSize), maxLeverage: String(policy.data.maxLeverage), dailyLossLimit: String(policy.data.dailyLossLimit), requireConfirmation: policy.data.requireConfirmation, allowedSymbols: policy.data.allowedSymbols.join(', ') }); }, [policy.data]);
  const submit = (event: FormEvent) => { event.preventDefault(); update.mutate({ data: { maxTradeSize: Number(form.maxTradeSize), maxLeverage: Number(form.maxLeverage), dailyLossLimit: Number(form.dailyLossLimit), requireConfirmation: form.requireConfirmation, allowedSymbols: form.allowedSymbols.split(',').map((s) => s.trim()).filter(Boolean) } }, { onSuccess: () => { setSaved('Policy saved and active.'); queryClient.invalidateQueries({ queryKey: getGetPolicyQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); }, onError: () => setSaved('Policy could not be saved. Nothing changed.') }); };
  const fields = [{ key: 'maxTradeSize', label: 'Maximum trade size', unit: 'USD', hint: 'Caps each individual order before it reaches the exchange.', icon: SlidersHorizontal }, { key: 'maxLeverage', label: 'Maximum leverage', unit: '×', hint: 'Keeps position sizing proportional to your available capital.', icon: BarChart3 }, { key: 'dailyLossLimit', label: 'Daily loss limit', unit: 'USD', hint: 'Stops new actions when your realized loss reaches this threshold.', icon: TrendingDown }];
  return <div className="orbit-rise space-y-7"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#278f76]">risk architecture</div><h1 className="mt-2 text-[30px] font-bold tracking-[-0.055em]">Execution policy</h1><p className="mt-1.5 max-w-xl text-[12px] text-muted-foreground">Your boundaries are the product. Orbit treats them as hard constraints, not suggestions.</p></div><QueryState loading={policy.isLoading} error={policy.error} onRetry={() => policy.refetch()}><form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.8fr)]"><section className="orbit-panel rounded-xl border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center justify-between border-b border-border pb-4"><div><h2 className="text-[15px] font-bold">Active guardrails</h2><p className="mt-1 text-[10px] text-muted-foreground">Changes apply to the next analysis.</p></div><div className="flex items-center gap-1.5 rounded-full bg-[#dcefe9] px-2.5 py-1 font-mono text-[9px] uppercase text-[#278f76] dark:bg-[#55c7a1]/10 dark:text-[#8ad3bd]"><CheckCircle2 className="h-3 w-3" /> active</div></div><div className="space-y-5">{fields.map((field) => { const Icon = field.icon; return <label key={field.key} className="block"><span className="flex items-center gap-2 text-[11px] font-semibold"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{field.label}</span><span className="mt-2 flex items-center rounded-lg border border-input bg-background focus-within:border-primary"><input required min="1" type="number" step="any" value={form[field.key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} data-testid={`input-${field.key}`} className="w-full bg-transparent px-3 py-2.5 text-[13px] font-semibold outline-none" /><span className="pr-3 font-mono text-[10px] text-muted-foreground">{field.unit}</span></span><span className="mt-1.5 block text-[10px] leading-relaxed text-muted-foreground">{field.hint}</span></label>; })}<label className="block"><span className="text-[11px] font-semibold">Allowed symbols</span><input required value={form.allowedSymbols} onChange={(e) => setForm({ ...form, allowedSymbols: e.target.value })} data-testid="input-allowed-symbols" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-[11px] outline-none focus:border-primary" /><span className="mt-1.5 block text-[10px] text-muted-foreground">Comma-separated. Orbit will block analysis outside this list.</span></label><label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/40 p-3.5"><span><span className="block text-[11px] font-semibold">Require confirmation</span><span className="mt-1 block text-[10px] text-muted-foreground">Never send an order without your explicit approval.</span></span><input type="checkbox" checked={form.requireConfirmation} onChange={(e) => setForm({ ...form, requireConfirmation: e.target.checked })} data-testid="input-require-confirmation" className="h-4 w-4 accent-[#dcae12]" /></label></div><div className="mt-7 flex items-center justify-end gap-3 border-t border-border pt-5">{saved && <span className={cn('mr-auto text-[10px]', saved.includes('could') ? 'text-destructive' : 'text-[#278f76]')}>{saved}</span>}<button type="submit" data-testid="button-save-policy" disabled={update.isPending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[10px] font-bold text-primary-foreground hover:brightness-95 disabled:opacity-60">{update.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {update.isPending ? 'saving…' : 'save policy'}</button></div></section><aside className="space-y-4"><div className="rounded-xl border border-sidebar-border bg-sidebar p-5 text-sidebar-accent-foreground"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary"><CircleHelp className="h-3.5 w-3.5" /> why this matters</div><p className="mt-4 text-[12px] leading-relaxed text-sidebar-foreground/75">A good copilot does not need more permission. It needs a clearer contract.</p><div className="mt-5 space-y-3">{['Size limits prevent one bad thesis from becoming a large loss.', 'Leverage limits keep volatility from becoming a liquidation event.', 'Confirmation keeps the final decision with the person who owns the risk.'].map((text, i) => <div key={i} className="flex gap-2.5 border-t border-sidebar-border pt-3 text-[10px] leading-relaxed text-sidebar-foreground/70"><span className="font-mono text-primary">0{i + 1}</span><span>{text}</span></div>)}</div></div><div className="rounded-xl border border-[#e8d4a7] bg-[#fff9e9] p-5 dark:border-[#5b4a20] dark:bg-[#302914]"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#8b6910] dark:text-primary"><LockKeyhole className="h-3.5 w-3.5" /> withdrawal lock</div><p className="mt-2 text-[10px] leading-relaxed text-[#8b6910]/75 dark:text-primary/70">Withdrawals are always blocked in Orbit. This is a permanent safety boundary.</p></div></aside></form></QueryState></div>;
}

function SettingsPage() {
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [saved, setSaved] = useState(false);
  return <div className="orbit-rise space-y-7"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#278f76]">control surface</div><h1 className="mt-2 text-[30px] font-bold tracking-[-0.055em]">Settings</h1><p className="mt-1.5 text-[12px] text-muted-foreground">Connection mode, readiness, and the details around your account.</p></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]"><section className="orbit-panel rounded-xl border border-border bg-card p-5 md:p-7"><div className="border-b border-border pb-5"><h2 className="text-[15px] font-bold">Connection mode</h2><p className="mt-1 text-[10px] text-muted-foreground">Choose where Orbit is allowed to observe and prepare.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" data-testid="button-mode-demo" onClick={() => setMode('demo')} className={cn('rounded-xl border p-4 text-left transition-colors', mode === 'demo' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}><div className="flex items-center justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/25 text-[#98710d]"><Command className="h-4 w-4" /></div>{mode === 'demo' && <CheckCircle2 className="h-4 w-4 text-[#278f76]" />}</div><div className="mt-4 text-[12px] font-bold">Demo mode</div><p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">Uses simulated balances and paper execution. Safe for exploring the cockpit.</p></button><button type="button" data-testid="button-mode-live" onClick={() => setMode('live')} className={cn('rounded-xl border p-4 text-left transition-colors', mode === 'live' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}><div className="flex items-center justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dcefe9] text-[#278f76] dark:bg-[#55c7a1]/10"><KeyRound className="h-4 w-4" /></div>{mode === 'live' && <CheckCircle2 className="h-4 w-4 text-[#278f76]" />}</div><div className="mt-4 text-[12px] font-bold">Live connection</div><p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">Connects to Binance with withdrawals disabled and your policy enforced.</p></button></div><div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4"><div><div className="text-[11px] font-semibold">Save connection preference</div><div className="mt-1 text-[10px] text-muted-foreground">This only changes readiness; it never executes an order.</div></div><button type="button" data-testid="button-save-settings" onClick={() => setSaved(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-[10px] font-bold text-primary-foreground">{saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{saved ? 'saved' : 'save'}</button></div></section><aside className="space-y-4"><div className="orbit-panel rounded-xl border border-border bg-card p-5"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><Activity className="h-3.5 w-3.5" /> readiness checklist</div><div className="mt-5 space-y-4">{[{label: 'Workspace initialized', done: true}, {label: 'Execution policy active', done: true}, {label: 'Market data connected', done: !!dashboard.data}, {label: 'Binance account', done: mode === 'live'}].map((item, i) => <div key={i} className="flex items-center gap-3"><div className={cn('flex h-5 w-5 items-center justify-center rounded-full', item.done ? 'bg-[#dcefe9] text-[#278f76] dark:bg-[#55c7a1]/15' : 'border border-border text-muted-foreground')}>{item.done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}</div><span className={cn('text-[11px]', item.done ? 'font-semibold' : 'text-muted-foreground')}>{item.label}</span></div>)}</div></div><div className="rounded-xl border border-[#e8d4a7] bg-[#fff9e9] p-5 dark:border-[#5b4a20] dark:bg-[#302914]"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#8b6910] dark:text-primary"><ShieldCheck className="h-3.5 w-3.5" /> what never changes</div><p className="mt-2 text-[10px] leading-relaxed text-[#8b6910]/75 dark:text-primary/70">Orbit will never enable withdrawals, bypass your policy, or execute without confirmation.</p></div></aside></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/activity" component={ActivityPage} /><Route path="/policies" component={PoliciesPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;