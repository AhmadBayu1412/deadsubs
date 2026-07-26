import { useEffect } from 'react';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, getMonthlyEquivalent } from '../../utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import type { Category } from '../../models/subscription';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../models/subscription';

export function AnalyticsPage() {
  const { subscriptions, fetchAll } = useSubscriptionStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const active = subscriptions.filter((s) => s.status === 'active');

  const totalMonthly = active.reduce(
    (sum, s) => sum + getMonthlyEquivalent(s.cost, s.billingCycle),
    0
  );

  // Category breakdown
  const byCategory: Record<string, number> = {};
  active.forEach((s) => {
    byCategory[s.category] =
      (byCategory[s.category] || 0) + getMonthlyEquivalent(s.cost, s.billingCycle);
  });

  const categoryData = Object.entries(byCategory)
    .filter(([, val]) => val > 0)
    .map(([cat, val]) => ({
      name: CATEGORY_LABELS[cat as Category],
      value: val,
      color: CATEGORY_COLORS[cat as Category],
    }))
    .sort((a, b) => b.value - a.value);

  // Monthly burn history (simulate last 6 months based on current active subs)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const factor = 1 - (5 - i) * 0.02;
    return {
      month: label,
      spend: Math.round(totalMonthly * factor / 100) * 100,
    };
  });

  // Cancelled savings
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
  const cancelledData = cancelled.map((s) => ({
    month: new Date(s.updatedAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    saved: getMonthlyEquivalent(s.cost, s.billingCycle),
  }));

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Analytics</h1>
          <p className="text-sm text-secondary mt-1">Understand your spending patterns</p>
        </div>
        <EmptyState
          icon="savings"
          title="No data yet"
          description="Add subscriptions to see your analytics."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Analytics</h1>
        <p className="text-sm text-secondary mt-1">Understand your spending patterns</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide">
            Monthly Burn
          </p>
          <p className="text-3xl font-bold tabular-nums text-primary mt-1">
            {formatCurrency(totalMonthly)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide">
            Active Subs
          </p>
          <p className="text-3xl font-bold tabular-nums text-primary mt-1">{active.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide">
            Cancelled
          </p>
          <p className="text-3xl font-bold tabular-nums text-accent-red mt-1">
            {cancelled.length}
          </p>
        </Card>
      </div>

      {/* Monthly spend chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spend — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DF" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#78756E' }} />
              <YAxis tick={{ fontSize: 12, fill: '#78756E' }} tickFormatter={(v) => `$${v / 100}`} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Spend']} />
              <Bar dataKey="spend" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-secondary text-center py-8">No active subscriptions</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: '12px', color: '#1A1916' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category table */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-secondary py-2">Category</th>
                  <th className="text-right text-xs font-medium text-secondary py-2">Monthly</th>
                  <th className="text-right text-xs font-medium text-secondary py-2">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoryData.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-sm text-primary">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-sm font-semibold tabular-nums text-primary">
                      {formatCurrency(row.value)}
                    </td>
                    <td className="py-2.5 text-right text-sm text-secondary">
                      {totalMonthly > 0
                        ? `${Math.round((row.value / totalMonthly) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation impact */}
      {cancelledData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Savings After Cancellations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={cancelledData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DF" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#78756E' }} />
                <YAxis tick={{ fontSize: 12, fill: '#78756E' }} tickFormatter={(v) => `$${v / 100}`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Saved']} />
                <Line
                  type="monotone"
                  dataKey="saved"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#16A34A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
