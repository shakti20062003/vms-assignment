import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { poolsAdapter, complianceAdapter } from '../../infrastructure/otherAdapters';
import { ErrorBanner, SuccessBanner, SectionHeader, Badge, KPICard } from '../../../shared/components';
import type { Pool } from '../../../core/domain/types';

const ALL_SHIP_IDS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEARS = [2024, 2025];

function CBBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(Math.abs(value) / Math.max(Math.abs(max), 1) * 100, 100);
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-ocean-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${positive ? 'bg-jade-500' : 'bg-coral-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-xs ${positive ? 'text-jade-300' : 'text-coral-300'}`}>
        {(value / 1e6).toFixed(2)} Mt
      </span>
    </div>
  );
}

export function PoolingTab() {
  const qc = useQueryClient();
  const [year, setYear] = useState(2024);
  const [members, setMembers] = useState<string[]>(['R001', 'R002']);
  const [createdPool, setCreatedPool] = useState<Pool | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch adjusted CB for each member to preview
  const memberCBs = useQuery({
    queryKey: ['pool-preview', members, year],
    queryFn: async () => {
      const results = await Promise.all(
        members.map(id => complianceAdapter.getAdjustedCB(id, year).catch(() => ({
          shipId: id, year, cbRaw: 0, banked: 0, cbAdjusted: 0
        })))
      );
      return results;
    },
    enabled: members.length > 0,
  });

  const cbData = memberCBs.data ?? [];
  const sumCB = cbData.reduce((s, m) => s + m.cbAdjusted, 0);
  const poolValid = members.length >= 2 && sumCB >= 0;
  const maxAbs = Math.max(...cbData.map(m => Math.abs(m.cbAdjusted)), 1);

  const createPoolMutation = useMutation({
    mutationFn: () => poolsAdapter.createPool(year, members),
    onSuccess: (pool) => {
      setCreatedPool(pool);
      setSuccess(`Pool created with ${pool.members?.length ?? 0} members`);
      setError('');
      qc.invalidateQueries({ queryKey: ['pool-preview'] });
    },
    onError: (err: Error) => { setError(err.message); setSuccess(''); },
  });

  const addMember = (id: string) => {
    if (!members.includes(id)) setMembers(prev => [...prev, id]);
  };
  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m !== id));

  return (
    <div className="fade-in">
      <SectionHeader
        title="Pooling — Article 21"
        subtitle="Form compliance pools to collectively meet FuelEU targets"
        actions={
          <div className="flex items-center gap-1.5 text-ocean-400 text-xs font-mono">
            <Users size={13} />
            FuelEU Art. 21
          </div>
        }
      />

      {success && <div className="mb-4"><SuccessBanner message={success} onDismiss={() => setSuccess('')} /></div>}
      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pool Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-mono text-ocean-300 uppercase tracking-widest mb-4">Pool Configuration</h3>

            {/* Year selector */}
            <div className="mb-4">
              <label className="text-ocean-400 text-xs font-mono block mb-1.5">Compliance Year</label>
              <select className="select-field w-full" value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Add member */}
            <div className="mb-4">
              <label className="text-ocean-400 text-xs font-mono block mb-1.5">Add Ship</label>
              <select
                className="select-field w-full"
                onChange={e => { if (e.target.value) addMember(e.target.value); e.target.value = ''; }}
                defaultValue=""
              >
                <option value="">— Select ship —</option>
                {ALL_SHIP_IDS.filter(id => !members.includes(id)).map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            {/* Members list */}
            <div className="space-y-2 mb-4">
              {members.map(id => (
                <div key={id} className="flex items-center justify-between py-2 px-3 card-inner rounded-lg">
                  <span className="font-mono text-sm text-ocean-200">{id}</span>
                  <button onClick={() => removeMember(id)} className="text-ocean-500 hover:text-coral-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-ocean-500 text-xs text-center py-4">Add at least 2 ships</p>
              )}
            </div>

            {/* Pool sum indicator */}
            <div className={`p-3 rounded-lg border mb-4 ${poolValid ? 'bg-jade-500/10 border-jade-500/30' : 'bg-coral-500/10 border-coral-500/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                {poolValid ? <CheckCircle2 size={13} className="text-jade-400" /> : <AlertTriangle size={13} className="text-coral-400" />}
                <span className={`text-xs font-mono ${poolValid ? 'text-jade-300' : 'text-coral-300'}`}>
                  Pool Sum CB
                </span>
              </div>
              <span className={`text-lg font-display ${sumCB >= 0 ? 'text-jade-300' : 'text-coral-300'}`}>
                {(sumCB / 1e6).toFixed(3)} MtCO₂e
              </span>
              {!poolValid && members.length >= 2 && (
                <p className="text-coral-400 text-xs mt-1">Sum must be ≥ 0 to create pool</p>
              )}
              {members.length < 2 && (
                <p className="text-ocean-500 text-xs mt-1">Need at least 2 members</p>
              )}
            </div>

            <button
              className="btn-primary w-full justify-center"
              disabled={!poolValid || createPoolMutation.isPending}
              onClick={() => createPoolMutation.mutate()}
            >
              <Plus size={14} />
              {createPoolMutation.isPending ? 'Creating Pool…' : 'Create Pool'}
            </button>
          </div>
        </div>

        {/* Right: Preview & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Member CB Preview */}
          <div className="card p-5">
            <h3 className="text-sm font-mono text-ocean-300 uppercase tracking-widest mb-4">
              Member Compliance Balances {memberCBs.isLoading && <span className="text-ocean-500">(loading…)</span>}
            </h3>
            {cbData.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ship ID</th>
                    <th>Raw CB</th>
                    <th>Banked</th>
                    <th>Adjusted CB</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cbData.map(m => (
                    <tr key={m.shipId}>
                      <td className="font-mono">{m.shipId}</td>
                      <td><CBBar value={m.cbRaw} max={maxAbs} /></td>
                      <td className="font-mono text-xs text-ocean-400">{(m.banked / 1e6).toFixed(3)} Mt</td>
                      <td><CBBar value={m.cbAdjusted} max={maxAbs} /></td>
                      <td>
                        <Badge variant={m.cbAdjusted >= 0 ? 'success' : 'danger'} size="sm">
                          {m.cbAdjusted >= 0 ? 'Surplus' : 'Deficit'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-ocean-500 text-sm text-center py-8">Add ships to preview their balances</p>
            )}
          </div>

          {/* Created pool result */}
          {createdPool && (
            <div className="card p-5 fade-in">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-jade-400" />
                <h3 className="text-sm font-mono text-ocean-300 uppercase tracking-widest">Pool Result</h3>
                <span className="font-mono text-xs text-ocean-400 ml-auto">{createdPool.id?.slice(0, 8)}…</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <KPICard label="Year" value={createdPool.year} />
                <KPICard label="Pool Sum CB" value={(createdPool.totalCb / 1e6).toFixed(3)} unit="MtCO₂e" highlight="success" />
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ship</th>
                    <th>CB Before</th>
                    <th>CB After</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {(createdPool.members ?? []).map(m => {
                    const delta = m.cbAfter - m.cbBefore;
                    return (
                      <tr key={m.shipId}>
                        <td className="font-mono">{m.shipId}</td>
                        <td><CBBar value={m.cbBefore} max={maxAbs} /></td>
                        <td><CBBar value={m.cbAfter} max={maxAbs} /></td>
                        <td>
                          <span className={`font-mono text-xs ${delta >= 0 ? 'text-jade-300' : 'text-coral-300'}`}>
                            {delta >= 0 ? '+' : ''}{(delta / 1e6).toFixed(3)} Mt
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
