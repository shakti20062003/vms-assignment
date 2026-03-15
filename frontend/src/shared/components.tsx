import React from 'react';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Badge ──────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}
export function Badge({ variant, children, size = 'md' }: BadgeProps) {
  const colors = {
    success: 'bg-jade-500/15 text-jade-300 border-jade-500/30',
    danger:  'bg-coral-500/15 text-coral-300 border-coral-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    neutral: 'bg-ocean-700/40 text-ocean-200 border-ocean-600/40',
  };
  const sz = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 ${sz} rounded-full border font-mono font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-ocean-400" />;
}

// ─── LoadingState ─────────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading data…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Spinner size={32} />
      <p className="text-ocean-300 text-sm font-mono">{message}</p>
    </div>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-coral-500/10 border border-coral-500/30 text-coral-300">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-coral-400 hover:text-coral-200 text-xs ml-auto">✕</button>
      )}
    </div>
  );
}

// ─── SuccessBanner ────────────────────────────────────────────────────────────
export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-jade-500/10 border border-jade-500/30 text-jade-300">
      <span className="text-sm flex-1">✓ {message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-jade-400 hover:text-jade-200 text-xs ml-auto">✕</button>
      )}
    </div>
  );
}

// ─── KPICard ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: 'success' | 'danger' | 'warning' | 'default';
  subtext?: string;
}
export function KPICard({ label, value, unit, trend, highlight = 'default', subtext }: KPICardProps) {
  const highlights = {
    success: 'border-jade-500/40 glow-jade',
    danger:  'border-coral-500/40 glow-coral',
    warning: 'border-amber-500/40',
    default: 'border-ocean-700/40',
  };
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-jade-400' : trend === 'down' ? 'text-coral-400' : 'text-ocean-400';

  return (
    <div className={`card p-5 fade-in ${highlights[highlight]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-ocean-300 text-xs font-mono uppercase tracking-widest">{label}</span>
        {trend && <TrendIcon size={14} className={trendColor} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-display text-ocean-100">{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}</span>
        {unit && <span className="text-ocean-400 text-xs font-mono">{unit}</span>}
      </div>
      {subtext && <p className="text-ocean-400 text-xs mt-1">{subtext}</p>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-ocean-800 border border-ocean-700 flex items-center justify-center">
        <span className="text-ocean-400 text-xl">⚓</span>
      </div>
      <p className="text-ocean-200 font-medium">{title}</p>
      {description && <p className="text-ocean-400 text-sm text-center max-w-xs">{description}</p>}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-display text-ocean-100">{title}</h2>
        {subtitle && <p className="text-ocean-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
