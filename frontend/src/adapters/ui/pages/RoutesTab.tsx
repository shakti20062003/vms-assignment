import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Anchor, Filter, CheckCircle2 } from 'lucide-react';
import { routesAdapter } from '../../infrastructure/routesAdapter';
import { Badge, LoadingState, ErrorBanner, SuccessBanner, SectionHeader } from '../../../shared/components';
import { TARGET_INTENSITY } from '../../../core/domain/types';

const VESSEL_TYPES = ['', 'Container', 'BulkCarrier', 'Tanker', 'RoRo'];
const FUEL_TYPES = ['', 'HFO', 'LNG', 'MGO'];
const YEARS = ['', '2024', '2025'];

export function RoutesTab() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<{ vesselType: string; fuelType: string; year: string }>({ vesselType: '', fuelType: '', year: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes', filters],
    queryFn: () => routesAdapter.getRoutes({
      vesselType: filters.vesselType || undefined,
      fuelType: filters.fuelType || undefined,
      year: filters.year ? Number(filters.year) : undefined,
    }),
  });

  const baselineMutation = useMutation({
    mutationFn: (routeId: string) => routesAdapter.setBaseline(routeId),
    onSuccess: (_, routeId) => {
      setSuccess(`Route ${routeId} set as baseline successfully`);
      setError('');
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['comparison'] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess('');
    },
  });

  return (
    <div className="fade-in">
      <SectionHeader
        title="Route Registry"
        subtitle="All tracked vessel routes with GHG intensity and compliance metrics"
        actions={
          <div className="flex items-center gap-1.5 text-ocean-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-jade-400 pulse-glow" />
            Target: {TARGET_INTENSITY} gCO₂e/MJ
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 card-inner">
        <Filter size={14} className="text-ocean-400 shrink-0" />
        <select className="select-field" value={filters.vesselType} onChange={e => setFilters(f => ({ ...f, vesselType: e.target.value }))}>
          {VESSEL_TYPES.map(t => <option key={t} value={t}>{t || 'All Vessel Types'}</option>)}
        </select>
        <select className="select-field" value={filters.fuelType} onChange={e => setFilters(f => ({ ...f, fuelType: e.target.value }))}>
          {FUEL_TYPES.map(t => <option key={t} value={t}>{t || 'All Fuel Types'}</option>)}
        </select>
        <select className="select-field" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
          {YEARS.map(y => <option key={y} value={y}>{y || 'All Years'}</option>)}
        </select>
        {(filters.vesselType || filters.fuelType || filters.year) && (
          <button className="btn-ghost text-xs" onClick={() => setFilters({ vesselType: '', fuelType: '', year: '' })}>Clear</button>
        )}
      </div>

      {success && <div className="mb-4"><SuccessBanner message={success} onDismiss={() => setSuccess('')} /></div>}
      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

      {isLoading ? <LoadingState message="Fetching routes…" /> : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Vessel Type</th>
                <th>Fuel</th>
                <th>Year</th>
                <th>GHG Intensity</th>
                <th>Fuel Cons. (t)</th>
                <th>Distance (km)</th>
                <th>Emissions (t)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(route => {
                const compliant = route.ghgIntensity <= TARGET_INTENSITY;
                return (
                  <tr key={route.id}>
                    <td>
                      <span className="font-mono text-ocean-300">{route.routeId}</span>
                      {route.isBaseline && (
                        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded font-mono">
                          <Anchor size={10} /> BASE
                        </span>
                      )}
                    </td>
                    <td>{route.vesselType}</td>
                    <td>
                      <Badge variant={route.fuelType === 'LNG' ? 'success' : route.fuelType === 'HFO' ? 'danger' : 'neutral'}>
                        {route.fuelType}
                      </Badge>
                    </td>
                    <td className="font-mono">{route.year}</td>
                    <td>
                      <span className={`font-mono font-medium ${compliant ? 'text-jade-300' : 'text-coral-300'}`}>
                        {route.ghgIntensity.toFixed(1)}
                      </span>
                    </td>
                    <td className="font-mono">{route.fuelConsumption.toLocaleString()}</td>
                    <td className="font-mono">{route.distance.toLocaleString()}</td>
                    <td className="font-mono">{route.totalEmissions.toLocaleString()}</td>
                    <td>
                      <Badge variant={compliant ? 'success' : 'danger'}>
                        {compliant ? '✓ Compliant' : '✗ Non-compliant'}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="btn-ghost text-xs py-1"
                        disabled={route.isBaseline || baselineMutation.isPending}
                        onClick={() => baselineMutation.mutate(route.routeId)}
                      >
                        {route.isBaseline ? <><CheckCircle2 size={12} /> Baseline</> : 'Set Baseline'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {routes.length === 0 && (
            <div className="py-12 text-center text-ocean-400 text-sm">No routes match the selected filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
