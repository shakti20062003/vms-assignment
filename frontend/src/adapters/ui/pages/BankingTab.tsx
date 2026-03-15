import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { bankingAdapter, complianceAdapter } from '../../infrastructure/otherAdapters';
import {
  KPICard, LoadingState, ErrorBanner, SuccessBanner, SectionHeader, Badge
} from '../../../shared/components';

const SHIP_IDS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEARS = [2024, 2025];

export function BankingTab() {
  const qc = useQueryClient();
  const [shipId, setShipId] = useState('R002');
  const [year, setYear] = useState(2024);
  const [applyAmount, setApplyAmount] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['banking', shipId, year],
    queryFn: () => bankingAdapter.getBankRecords(shipId, year),
  });

  const { data: adjustedCB } = useQuery({
    queryKey: ['adjusted-cb', shipId, year],
    queryFn: () => complianceAdapter.getAdjustedCB(shipId, year),
  });

  const bankMutation = useMutation({
    mutationFn: () => bankingAdapter.bankSurplus(shipId, year),
    onSuccess: (data) => {
      setSuccess(`Banked ${data.cbBefore.toFixed(0)} gCO₂e surplus for ${shipId}`);
      setError('');
      qc.invalidateQueries({ queryKey: ['banking', shipId, year] });
      qc.invalidateQueries({ queryKey: ['adjusted-cb', shipId, year] });
    },
    onError: (err: Error) => { setError(err.message); setSuccess(''); },
  });

  const applyMutation = useMutation({
    mutationFn: () => bankingAdapter.applyBanked(shipId, year, Number(applyAmount)),
    onSuccess: (data) => {
      setSuccess(`Applied ${data.applied?.toLocaleString()} gCO₂e banked surplus. CB: ${data.cbBefore.toFixed(0)} → ${data.cbAfter.toFixed(0)}`);
      setError('');
      setApplyAmount('');
      qc.invalidateQueries({ queryKey: ['banking', shipId, year] });
      qc.invalidateQueries({ queryKey: ['adjusted-cb', shipId, year] });
    },
    onError: (err: Error) => { setError(err.message); setSuccess(''); },
  });

  const totalBanked = records?.total ?? 0;
  const canBank = (adjustedCB?.cbRaw ?? 0) > 0;
  const canApply = totalBanked > 0;

  return (
    <div className="fade-in">
      <SectionHeader
        title="Banking — Article 20"
        subtitle="Bank surplus compliance balance or apply banked surplus to deficits"
        actions={
          <div className="flex items-center gap-1.5 text-ocean-400 text-xs font-mono">
            <Landmark size={13} />
            FuelEU Art. 20
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 card-inner">
        <div className="flex flex-col gap-1">
          <label className="text-ocean-400 text-xs font-mono">Ship ID</label>
          <select className="select-field" value={shipId} onChange={e => setShipId(e.target.value)}>
            {SHIP_IDS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-ocean-400 text-xs font-mono">Year</label>
          <select className="select-field" value={year} onChange={e => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {success && <div className="mb-4"><SuccessBanner message={success} onDismiss={() => setSuccess('')} /></div>}
      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

      {recordsLoading ? <LoadingState /> : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KPICard
              label="Raw CB"
              value={adjustedCB?.cbRaw ? (adjustedCB.cbRaw / 1e6).toFixed(2) : '—'}
              unit="MtCO₂e"
              highlight={adjustedCB && adjustedCB.cbRaw > 0 ? 'success' : adjustedCB && adjustedCB.cbRaw < 0 ? 'danger' : 'default'}
              subtext={adjustedCB && adjustedCB.cbRaw > 0 ? 'Surplus available' : 'Deficit'}
            />
            <KPICard
              label="Total Banked"
              value={totalBanked ? (totalBanked / 1e6).toFixed(2) : '0.00'}
              unit="MtCO₂e"
              highlight={totalBanked > 0 ? 'success' : 'default'}
              subtext="Available to apply"
            />
            <KPICard
              label="Adjusted CB"
              value={adjustedCB ? ((adjustedCB.cbRaw + adjustedCB.banked) / 1e6).toFixed(2) : '—'}
              unit="MtCO₂e"
              highlight={adjustedCB && (adjustedCB.cbRaw + adjustedCB.banked) >= 0 ? 'success' : 'danger'}
              subtext="Raw + Banked"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Bank surplus */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownToLine size={16} className="text-jade-400" />
                <h3 className="text-sm font-medium text-ocean-100">Bank Surplus</h3>
              </div>
              <p className="text-ocean-400 text-xs mb-4">
                Move positive compliance balance into the bank for future use.
                Only available when CB &gt; 0.
              </p>
              <button
                className="btn-success w-full justify-center"
                disabled={!canBank || bankMutation.isPending}
                onClick={() => bankMutation.mutate()}
              >
                <ArrowDownToLine size={14} />
                {bankMutation.isPending ? 'Banking…' : 'Bank Surplus CB'}
              </button>
              {!canBank && (
                <p className="text-ocean-500 text-xs mt-2 text-center">CB must be &gt; 0 to bank surplus</p>
              )}
            </div>

            {/* Apply banked */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpFromLine size={16} className="text-amber-400" />
                <h3 className="text-sm font-medium text-ocean-100">Apply Banked Surplus</h3>
              </div>
              <p className="text-ocean-400 text-xs mb-4">
                Apply previously banked surplus to offset a deficit. Available: {(totalBanked / 1e6).toFixed(3)} MtCO₂e
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount (gCO₂e)"
                  className="input-field flex-1"
                  value={applyAmount}
                  onChange={e => setApplyAmount(e.target.value)}
                  disabled={!canApply}
                  min="0"
                  max={totalBanked}
                />
                <button
                  className="btn-primary"
                  disabled={!canApply || !applyAmount || Number(applyAmount) <= 0 || applyMutation.isPending}
                  onClick={() => applyMutation.mutate()}
                >
                  <ArrowUpFromLine size={14} />
                  {applyMutation.isPending ? 'Applying…' : 'Apply'}
                </button>
              </div>
              {!canApply && (
                <p className="text-ocean-500 text-xs mt-2">No banked surplus available</p>
              )}
            </div>
          </div>

          {/* Bank entries history */}
          {records && records.entries.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-ocean-700/40">
                <h3 className="text-sm font-mono text-ocean-300 uppercase tracking-widest">Bank Entry History</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ship</th>
                    <th>Year</th>
                    <th>Amount (gCO₂e)</th>
                    <th>Type</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.entries.map(entry => (
                    <tr key={entry.id}>
                      <td className="font-mono text-ocean-400 text-xs">{entry.id.slice(0, 8)}…</td>
                      <td className="font-mono">{entry.shipId}</td>
                      <td className="font-mono">{entry.year}</td>
                      <td>
                        <span className={`font-mono font-medium ${entry.amountGco2eq > 0 ? 'text-jade-300' : 'text-coral-300'}`}>
                          {entry.amountGco2eq > 0 ? '+' : ''}{entry.amountGco2eq.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <Badge variant={entry.amountGco2eq > 0 ? 'success' : 'danger'} size="sm">
                          {entry.amountGco2eq > 0 ? 'Bank' : 'Deduct'}
                        </Badge>
                      </td>
                      <td className="font-mono text-ocean-400 text-xs">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
