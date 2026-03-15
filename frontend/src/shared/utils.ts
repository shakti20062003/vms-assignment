export function formatCB(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(2);
}

export function formatGHG(value: number): string {
  return `${value.toFixed(4)} gCO₂e/MJ`;
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value);
}

export function cbStatus(cb: number): 'surplus' | 'deficit' | 'neutral' {
  if (cb > 0) return 'surplus';
  if (cb < 0) return 'deficit';
  return 'neutral';
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
