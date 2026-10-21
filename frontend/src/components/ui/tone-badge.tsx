import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * A badge coloured by meaning rather than by severity. Ported from prr-app.
 *
 * Severity ("did it work") has about five useful colours. A clinical note's
 * type has ten, and a care setting four, and a reader needs to tell a Shift
 * Handover from an Incident Report at a glance down a long list — so these
 * are coloured by category, not by how bad they are.
 *
 * Every class string is written out in full so Tailwind generates it.
 */
export type BadgeTone =
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'teal'
  | 'cyan'
  | 'emerald'
  | 'green'
  | 'amber'
  | 'orange'
  | 'red'
  | 'rose'
  | 'slate';

const SOFT: Record<BadgeTone, string> = {
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  violet: 'border-violet-200 bg-violet-50 text-violet-800',
  purple: 'border-purple-200 bg-purple-50 text-purple-800',
  fuchsia: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  teal: 'border-teal-200 bg-teal-50 text-teal-800',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  green: 'border-green-200 bg-green-50 text-green-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  red: 'border-red-200 bg-red-50 text-red-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};

const STRONG: Record<BadgeTone, string> = {
  sky: 'border-sky-600 bg-sky-600 text-white',
  blue: 'border-blue-600 bg-blue-600 text-white',
  indigo: 'border-indigo-600 bg-indigo-600 text-white',
  violet: 'border-violet-600 bg-violet-600 text-white',
  purple: 'border-purple-600 bg-purple-600 text-white',
  fuchsia: 'border-fuchsia-600 bg-fuchsia-600 text-white',
  teal: 'border-teal-600 bg-teal-600 text-white',
  cyan: 'border-cyan-600 bg-cyan-600 text-white',
  emerald: 'border-emerald-600 bg-emerald-600 text-white',
  green: 'border-green-600 bg-green-600 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
  orange: 'border-orange-600 bg-orange-600 text-white',
  red: 'border-red-600 bg-red-600 text-white',
  rose: 'border-rose-600 bg-rose-600 text-white',
  slate: 'border-slate-600 bg-slate-600 text-white',
};

const DOT: Record<BadgeTone, string> = {
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
};

export interface ToneBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: BadgeTone;
  /** Solid fill instead of a tint, for the few values that must stand out. */
  strong?: boolean;
  /** A leading dot in the tone's colour. */
  withDot?: boolean;
}

export function ToneBadge({ tone, strong = false, withDot = false, className, children, ...props }: ToneBadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap',
        strong ? STRONG[tone] : SOFT[tone],
        className,
      )}
      {...props}
    >
      {withDot && <span className={cn('size-1.5 shrink-0 rounded-full', strong ? 'bg-white/80' : DOT[tone])} />}
      <span className="truncate">{children}</span>
    </span>
  );
}
