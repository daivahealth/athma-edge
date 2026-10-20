'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface IntakeOutputChartProps {
  data: Record<string, any> | null | undefined;
}

type SectionKey = 'intake' | 'output';

const SECTION_LABELS: Record<SectionKey, string> = {
  intake: 'Intake',
  output: 'Output',
};

const TOTAL_KEYS: Record<SectionKey, string> = {
  intake: 'Total Intake',
  output: 'Total Output',
};

// Group entries in the chart JSON look like { data: {...}, record?: {...} }; scalar summary
// fields (e.g. colloidIntakeTotal) and the section's own total entry are excluded from grouping.
function getGroupKeys(section: Record<string, any> | undefined, totalKey: string): string[] {
  if (!section) return [];
  return Object.keys(section).filter(
    (key) => key !== totalKey && section[key] && typeof section[key] === 'object' && section[key].data,
  );
}

function collectTimestamps(section: Record<string, any> | undefined): string[] {
  const timestamps = new Set<string>();
  if (!section) return [];
  for (const group of Object.values(section)) {
    if (!group || typeof group !== 'object') continue;
    const data = (group as any).data;
    if (data) {
      for (const key of Object.keys(data)) {
        if (key !== 'total') timestamps.add(key);
      }
    }
  }
  return [...timestamps];
}

function formatColumnTime(timestamp: string): string {
  const time = timestamp.split('T')[1];
  return time || timestamp;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function sumColumn(section: Record<string, any> | undefined, totalKey: string, columns: string[]): number {
  const data = section?.[totalKey]?.data;
  if (!data) return 0;
  return columns.reduce((sum, ts) => sum + (data[ts]?.value ?? 0), 0);
}

export function IntakeOutputChart({ data }: IntakeOutputChartProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allDates = useMemo(() => {
    const dates = new Set<string>();
    for (const sectionKey of ['intake', 'output'] as SectionKey[]) {
      for (const ts of collectTimestamps(data?.[sectionKey])) {
        dates.add(ts.split('T')[0]);
      }
    }
    return [...dates].sort();
  }, [data]);

  const [dateIndex, setDateIndex] = useState(() => Math.max(allDates.length - 1, 0));
  const selectedDate = allDates[dateIndex];

  const columns = useMemo(() => {
    if (!selectedDate) return [];
    const timestamps = new Set<string>();
    for (const sectionKey of ['intake', 'output'] as SectionKey[]) {
      for (const ts of collectTimestamps(data?.[sectionKey])) {
        if (ts.startsWith(selectedDate)) timestamps.add(ts);
      }
    }
    return [...timestamps].sort();
  }, [data, selectedDate]);

  if (!data || allDates.length === 0) {
    return <p className="py-4 text-center text-muted-foreground">No intake/output data available.</p>;
  }

  const intakeTotal = sumColumn(data.intake, TOTAL_KEYS.intake, columns);
  const outputTotal = sumColumn(data.output, TOTAL_KEYS.output, columns);
  const dayBalance = intakeTotal - outputTotal;

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-1 hover:bg-muted disabled:opacity-30"
            disabled={dateIndex <= 0}
            onClick={() => setDateIndex((i) => Math.max(i - 1, 0))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{formatDayLabel(selectedDate)}</span>
          <button
            type="button"
            className="rounded p-1 hover:bg-muted disabled:opacity-30"
            disabled={dateIndex >= allDates.length - 1}
            onClick={() => setDateIndex((i) => Math.min(i + 1, allDates.length - 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span>Intake : <span className="font-semibold text-blue-600">{intakeTotal}</span></span>
          <span>Output : <span className="font-semibold text-fuchsia-600">{outputTotal}</span></span>
          <span>Day Balance : <span className="font-semibold text-red-600">{dayBalance}</span></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route / Method</th>
              {columns.map((ts) => (
                <th key={ts} className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatColumnTime(ts)}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Run Total</th>
            </tr>
          </thead>
          <tbody>
            {(['intake', 'output'] as SectionKey[]).map((sectionKey) => {
              const section = data[sectionKey];
              const totalKey = TOTAL_KEYS[sectionKey];
              const groupKeys = getGroupKeys(section, totalKey);
              const sectionCollapsed = collapsed.has(sectionKey);

              return (
                <Fragment key={sectionKey}>
                  <tr className="bg-muted/30">
                    <td colSpan={columns.length + 2} className="px-3 py-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 font-semibold"
                        onClick={() => toggle(sectionKey)}
                      >
                        {sectionCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {SECTION_LABELS[sectionKey]}
                      </button>
                    </td>
                  </tr>

                  {!sectionCollapsed && groupKeys.map((groupKey) => {
                    const group = section[groupKey];
                    const groupCollapseKey = `${sectionKey}.${groupKey}`;
                    const groupCollapsed = collapsed.has(groupCollapseKey);
                    const recordKeys = group.record ? Object.keys(group.record) : [];

                    return (
                      <Fragment key={groupCollapseKey}>
                        <tr className="border-b">
                          <td className="px-3 py-2 pl-7">
                            <button
                              type="button"
                              className="flex items-center gap-1 font-medium"
                              onClick={() => toggle(groupCollapseKey)}
                              disabled={recordKeys.length === 0}
                            >
                              {recordKeys.length > 0 && (
                                groupCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              {groupKey}
                            </button>
                          </td>
                          {columns.map((ts) => (
                            <td key={ts} className="px-3 py-2 text-center">{group.data?.[ts]?.value ?? ''}</td>
                          ))}
                          <td className="px-3 py-2 text-center font-medium bg-yellow-50">{group.data?.total?.value ?? ''}</td>
                        </tr>

                        {!groupCollapsed && recordKeys.map((recordKey) => {
                          const record = group.record[recordKey];
                          return (
                            <tr key={`${groupCollapseKey}.${recordKey}`} className="border-b">
                              <td className="px-3 py-2 pl-14 text-muted-foreground">{recordKey}</td>
                              {columns.map((ts) => (
                                <td key={ts} className="px-3 py-2 text-center">{record[ts]?.value ?? ''}</td>
                              ))}
                              <td className="px-3 py-2 text-center bg-yellow-50">{record.total?.value ?? ''}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}

                  {!sectionCollapsed && section?.[totalKey] && (
                    <tr className="border-b">
                      <td className={cn('px-3 py-2 font-semibold', sectionKey === 'intake' ? 'text-blue-600' : 'text-fuchsia-600')}>
                        {totalKey}
                      </td>
                      {columns.map((ts) => (
                        <td key={ts} className={cn('px-3 py-2 text-center font-semibold', sectionKey === 'intake' ? 'text-blue-600' : 'text-fuchsia-600')}>
                          {section[totalKey].data?.[ts]?.value ?? ''}
                        </td>
                      ))}
                      <td className={cn('px-3 py-2 text-center font-semibold bg-yellow-100', sectionKey === 'intake' ? 'text-blue-600' : 'text-fuchsia-600')}>
                        {section[totalKey].data?.total?.value ?? ''}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
