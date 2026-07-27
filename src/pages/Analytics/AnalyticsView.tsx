// Phase 13 — Analytics View
// Subscription spending analytics with category breakdown and trends.
import { TrendingUp, CreditCard, Grid, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { clsx } from 'clsx';
import { PageTitle } from '../../components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { CategoryBadge } from '../../components/ui/Badge';
import { useAnalyticsViewModel } from './useAnalyticsViewModel';
import { CATEGORY_COLORS, BILLING_CYCLE_LABELS } from '../../types/subscription';

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
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
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          accent ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-blue/10 text-accent-blue',
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</p>
        <p className={clsx('text-2xl font-bold mt-0.5', accent ? 'text-accent-red' : 'text-primary')}>
          {value}
        </p>
        {sub && <p className="text-xs text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const { state } = useAnalyticsViewModel();

  const chartData = state.categoryBreakdown.map((item) => ({
    name: item.label,
    cost: item.totalCost / 100,
  }));

  return (
    <div className="space-y-6">
      <PageTitle title="Analytics" description="Your subscription insights" />

      {state.isLoading && (
        <div className="text-sm text-secondary">Loading analytics…</div>
      )}

      {!state.isLoading && (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Monthly spend"
              value={formatDollars(state.totalMonthly)}
              sub="/month"
              icon={TrendingUp}
            />
            <StatCard
              label="Yearly spend"
              value={formatDollars(state.totalYearly)}
              sub="/year"
              icon={CreditCard}
            />
            <StatCard
              label="Active services"
              value={String(state.activeCount)}
              sub={`${state.pausedCount} paused`}
              icon={Grid}
            />
            {state.mostExpensive ? (
              <StatCard
                label="Most expensive"
                value={formatDollars(
                  Math.round(
                    state.mostExpensive.cost *
                      (state.mostExpensive.billingCycle === 'yearly'
                        ? 1 / 12
                        : state.mostExpensive.billingCycle === 'weekly'
                        ? 4.33
                        : 1),
                  ),
                )}
                sub={state.mostExpensive.name}
                icon={DollarSign}
                accent
              />
            ) : (
              <StatCard
                label="Most expensive"
                value="—"
                sub="No active"
                icon={DollarSign}
              />
            )}
          </div>

          {/* Category breakdown chart */}
          {chartData.length > 0 && (
            <Card padding="none">
              <CardHeader>
                <CardTitle>Monthly spend by category</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Monthly']}
                      contentStyle={{
                        background: '#1A1916',
                        border: '1px solid #3A3A35',
                        borderRadius: '8px',
                        color: '#F8F7F4',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ?? '#60A5FA'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Category legend */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {state.categoryBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                      />
                      <span className="text-xs text-secondary">
                        {item.label} ({formatDollars(item.totalCost)})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {chartData.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-sm text-secondary">Add subscriptions to see analytics.</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming renewals */}
          {state.upcomingRenewals.length > 0 && (
            <Card padding="none">
              <CardHeader>
                <CardTitle>Upcoming renewals (next 7 days)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {state.upcomingRenewals.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CategoryBadge category={sub.category} />
                      <span className="text-sm font-medium text-primary">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-secondary">
                      <span>{formatDollars(sub.cost)}</span>
                      <span>{BILLING_CYCLE_LABELS[sub.billingCycle]}</span>
                      <span className="text-accent-red font-medium">
                        {new Date(sub.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
