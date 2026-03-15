
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { routesAdapter } from '../../infrastructure/routesAdapter';
import { LoadingState, ErrorBanner, SectionHeader, Badge, KPICard } from '../../../shared/components';
import { TARGET_INTENSITY } from '../../../core/domain/types';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 text-xs font-mono shadow-xl">
      <p className="text-ocean-200 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className={i === 0 ? 'text-amber-400' : 'text-ocean-300'}>
          {p.name}: {Number(p.value).toFixed(4)} gCO₂e/MJ
        </p>
      ))}
      <p className="text-ocean-500 mt-1">Target: {TARGET_INTENSITY}</p>
    </div>
  );
};

export function CompareTab() {
  const { data: comparisons = [], isLoading, error } = useQuery({
    queryKey: ['comparison'],
    queryFn: () => routesAdapter.getComparison(),
  });

  const chartData = comparisons.map(c => ({
    name: c.comparison.routeId,
    baseline: c.baseline.ghgIntensity,
    comparison: c.comparison.ghgIntensity,
    compliant: c.compliant,
  }));

  const compliantCount = comparisons.filter(c => c.compliant).length;
  const avgDiff = comparisons.length ? comparisons.reduce((s, c) => s + c.percentDiff, 0) / comparisons.length : 0;

  if (isLoading) return <LoadingState message="Computing comparisons…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;

  return (
    <div className="fade-in">
      <SectionHeader
        title="GHG Intensity Comparison"
        subtitle="Baseline vs comparison routes against the 2025 FuelEU target"
      />

      {comparisons.length === 0 ? (
        <div className="card p-8 text-center text-ocean-400">
          <p>No baseline set. Go to the Routes tab and set a baseline first.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KPICard label="Target Intensity" value={TARGET_INTENSITY} unit="gCO₂e/MJ" highlight="default" />
            <KPICard label="Compliant Routes" value={`${compliantCount} / ${comparisons.length}`} highlight={compliantCount === comparisons.length ? 'success' : 'warning'} />
            <KPICard label="Avg % vs Baseline" value={`${avgDiff >= 0 ? '+' : ''}${avgDiff.toFixed(2)}%`} trend={avgDiff > 0 ? 'up' : 'down'} highlight={avgDiff <= 0 ? 'success' : 'danger'} />
          </div>

          {/* Chart */}
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-mono text-ocean-300 uppercase tracking-widest mb-4">GHG Intensity by Route</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,71,120,0.3)" />
                <XAxis dataKey="name" tick={{ fill: '#4BA3E8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis
                  domain={[85, 97]}
                  tick={{ fill: '#4BA3E8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#8CCAF5' }} />
                <ReferenceLine y={TARGET_INTENSITY} stroke="#F59E0B" strokeDasharray="5 3" label={{ value: 'Target', fill: '#F59E0B', fontSize: 10 }} />
                <Bar dataKey="baseline" name="Baseline" radius={[4,4,0,0]} fill="#1260A8" opacity={0.7} />
                <Bar dataKey="comparison" name="Comparison" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.compliant ? '#10B97B' : '#F05252'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Comparison Route</th>
                  <th>Vessel / Fuel</th>
                  <th>Year</th>
                  <th>Baseline GHG</th>
                  <th>Route GHG</th>
                  <th>% Diff vs Baseline</th>
                  <th>vs Target</th>
                  <th>Compliant</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(c => (
                  <tr key={c.comparison.id}>
                    <td className="font-mono text-ocean-300">{c.comparison.routeId}</td>
                    <td>
                      <div className="text-xs">{c.comparison.vesselType}</div>
                      <Badge variant={c.comparison.fuelType === 'LNG' ? 'success' : c.comparison.fuelType === 'HFO' ? 'danger' : 'neutral'} size="sm">
                        {c.comparison.fuelType}
                      </Badge>
                    </td>
                    <td className="font-mono">{c.comparison.year}</td>
                    <td className="font-mono text-amber-400">{c.baseline.ghgIntensity.toFixed(1)}</td>
                    <td className="font-mono">{c.comparison.ghgIntensity.toFixed(1)}</td>
                    <td>
                      <span className={`font-mono font-medium ${c.percentDiff > 0 ? 'text-coral-300' : 'text-jade-300'}`}>
                        {c.percentDiff > 0 ? '+' : ''}{c.percentDiff.toFixed(3)}%
                      </span>
                    </td>
                    <td>
                      <span className={`font-mono text-xs ${c.comparison.ghgIntensity <= TARGET_INTENSITY ? 'text-jade-300' : 'text-coral-300'}`}>
                        {(c.comparison.ghgIntensity - TARGET_INTENSITY).toFixed(4)}
                      </span>
                    </td>
                    <td>
                      <Badge variant={c.compliant ? 'success' : 'danger'}>
                        {c.compliant ? '✅ Yes' : '❌ No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
