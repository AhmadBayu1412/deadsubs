// Phase 13 — Analytics View
// Full analytics dashboard: spending, categories, status, and renewal timeline.
import {
  TrendingUp,
  CreditCard,
  Grid,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { clsx } from 'clsx';
import { PageTitle } from '../../components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { CategoryBadge } from '../../components/ui/Badge';
import { useAnalyticsViewModel } from './useAnalyticsViewModel';
import { CATEGORY_COLORS, BILLING_CYCLE_LABELS } from '../../types/subscription';
import { formatCents } from '../../services/analyticsService';

// Custom tooltip for bar chart
function CategoryTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1A1916] border border-[#3A3A35] rounded-lg px-3 py-2 text-xs text-[#F8F7F4] shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-[#78756E]">Monthly: <span className="text-[#F8F7F4]">${payload[0].value.toFixed(2)}</span></p>
    </div>
  );
}

// Custom tooltip for area chart
function RenewalTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1A1916] border border-[#3A3A35] rounded-lg px-3 py-2 text-xs text-[#F8F7F4] shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-[#78756E]">Renewals: <span className="text-[#F8F7F4]">{payload[0].value}</span></p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 lg:p-5 flex items-start gap-3 lg:gap-4">
      <div
        className={clsx(
          'w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          accent
            ? 'bg-accent-red/10 text-accent-red'
            : 'bg-accent-blue/10 text-accent-blue',
        )}
      >
        <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</p>
        <p className={clsx('text-xl lg:text-2xl font-bold mt-0.5', accent ? 'text-accent-red' : 'text-primary')}>
          {value}
        </p>
        {sub && <p className="text-xs text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const { state } = useAnalyticsViewModel();
  const { metrics } = state;

  const chartData = metrics.byCategory.map((item) => ({
    name: item.label,
    monthly: item.monthlyTotal / 100,
    yearly: item.yearlyTotal / 100,
  }));

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageTitle title="Analytics" description="Your subscription insights" />

      {state.isLoading && (
        <div className="text-sm text-secondary">Loading analytics…</div>
      )}

      {!state.isLoading && (
        <>
          {/* Row 1: Key spending stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard
              label="Monthly spend"
              value={formatCents(metrics.totalMonthly)}
              sub="/month"
              icon={TrendingUp}
            />
            <StatCard
              label="Yearly spend"
              value={formatCents(metrics.totalYearly)}
              sub="/year"
              icon={CreditCard}
            />
            <StatCard
              label="Average price"
              value={formatCents(metrics.averageMonthly)}
              sub="/month avg"
              icon={BarChart3}
            />
            <StatCard
              label="Most expensive"
              value={metrics.mostExpensive
                ? formatCents(
                    Math.round(
                      metrics.mostExpensive.cost *
                        (metrics.mostExpensive.billingCycle === 'yearly'
                          ? 1 / 12
                          : metrics.mostExpensive.billingCycle === 'weekly'
                          ? 4.33
                          : 1),
                    ),
                  )
                : '—'}
              sub={metrics.mostExpensive?.name}
              icon={DollarSign}
              accent
            />
          </div>

          {/* Row 2: Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            {metrics.activeCount > 0 && (
              <StatCard
                label="Active"
                value={String(metrics.activeCount)}
                sub="subscriptions"
                icon={Grid}
              />
            )}
            {metrics.pausedCount > 0 && (
              <StatCard
                label="Paused"
                value={String(metrics.pausedCount)}
                sub="subscriptions"
                icon={RotateCcw}
              />
            )}
            {metrics.cancelledCount > 0 && (
              <StatCard
                label="Cancelled"
                value={String(metrics.cancelledCount)}
                sub="subscriptions"
                icon={RotateCcw}
              />
            )}
            <StatCard
              label="Overdue"
              value={String(metrics.overdueRenewals.length)}
              sub={metrics.overdueRenewals.length > 0 ? 'action needed' : 'all good'}
              icon={AlertTriangle}
              accent={metrics.overdueRenewals.length > 0}
            />
            <StatCard
              label="Due today"
              value={String(metrics.renewalsToday.length)}
              sub={metrics.renewalsToday.length > 0 ? 'renewing' : 'none due'}
              icon={Calendar}
              accent={metrics.renewalsToday.length > 0}
            />
          </div>

          {/* Row 3: Charts — category + timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category spend chart */}
            {chartData.length > 0 && (
              <Card padding="none">
                <CardHeader>
                  <CardTitle>Monthly spend by category</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#78756E' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#78756E' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `$${v}`}
                      />
                      <Tooltip content={<CategoryTooltip />} />
                      <Bar dataKey="monthly" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ?? '#60A5FA'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {metrics.byCategory.map((item) => (
                      <div key={item.category} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                        />
                        <span className="text-xs text-secondary">
                          {item.label} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Renewal timeline */}
            {metrics.renewalTimeline.length > 0 && (
              <Card padding="none">
                <CardHeader>
                  <CardTitle>Renewal timeline (30 days)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={metrics.renewalTimeline}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="renewalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#78756E' }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#78756E' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<RenewalTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#renewalGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Row 4: Status breakdown + overdue list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status breakdown */}
            <Card padding="none">
              <CardHeader>
                <CardTitle>Subscriptions by status</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {metrics.byStatus
                    .filter((item) => item.count > 0)
                    .map((item) => (
                      <div key={item.status} className="flex-1 text-center">
                        <p className="text-2xl font-bold text-primary">{item.count}</p>
                        <p className="text-xs text-secondary mt-0.5">{item.label}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Overdue list */}
            <Card padding="none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {metrics.overdueRenewals.length > 0 && (
                    <AlertTriangle className="w-4 h-4 text-accent-red" />
                  )}
                  Overdue renewals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {metrics.overdueRenewals.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-secondary">No overdue renewals</p>
                  </div>
                ) : (
                  metrics.overdueRenewals.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CategoryBadge category={sub.category} />
                        <span className="text-sm font-medium text-primary">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-secondary">
                        <span>{formatCents(sub.cost)}</span>
                        <span className="text-accent-red font-medium">
                          {Math.abs(
                            Math.ceil(
                              (new Date(sub.renewalDate).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          )}d overdue
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 5: Upcoming renewals */}
          {metrics.upcomingRenewals.length > 0 && (
            <Card padding="none">
              <CardHeader>
                <CardTitle>Upcoming renewals (next 30 days)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {metrics.upcomingRenewals.slice(0, 10).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryBadge category={sub.category} />
                      <span className="text-sm font-medium text-primary">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-secondary">
                      <span>{formatCents(sub.cost)}</span>
                      <span>{BILLING_CYCLE_LABELS[sub.billingCycle]}</span>
                      <span
                        className={clsx(
                          'font-medium',
                          new Date(sub.renewalDate) <= new Date()
                            ? 'text-accent-red'
                            : 'text-secondary',
                        )}
                      >
                        {new Date(sub.renewalDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {state.isEmpty && (
            <Card>
              <CardContent className="text-center py-12">
                <PieChart className="w-10 h-10 text-secondary/30 mx-auto mb-3" />
                <p className="text-sm text-secondary">Add subscriptions to see analytics.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
