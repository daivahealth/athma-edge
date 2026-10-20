'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-react';
import { useInvestigationResults } from '@/modules/investigation-results/hooks';
import { buildInvestigationResultTree, type MergedInvestigationNode } from '@/modules/investigation-results/merge';
import type { InvestigationResultValue } from '@/modules/investigation-results/types';
import { formatDateTime } from '@/lib/utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SyncTimestamp } from '@/components/layout/stale-data-warning';

interface InvestigationResultsTabContentProps {
  mrn: string;
}

export function InvestigationResultsTabContent({ mrn }: InvestigationResultsTabContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Investigation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lab">
          <TabsList>
            <TabsTrigger value="lab">Lab</TabsTrigger>
            <TabsTrigger value="rad">Rad</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
          </TabsList>
          <TabsContent value="lab">
            <LabResultsPanel mrn={mrn} />
          </TabsContent>
          <TabsContent value="rad">
            <PlaceholderPanel />
          </TabsContent>
          <TabsContent value="others">
            <PlaceholderPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PlaceholderPanel() {
  return <p className="py-8 text-center text-muted-foreground">Not available yet.</p>;
}

function LabResultsPanel({ mrn }: { mrn: string }) {
  const { data, isLoading } = useInvestigationResults(mrn, 'LAB');

  const tree = useMemo(() => {
    if (!data?.resultData) return [];
    return buildInvestigationResultTree(data.resultData.services, data.resultData.data);
  }, [data]);

  if (isLoading) {
    return <p className="py-4 text-center text-muted-foreground">Loading investigation results...</p>;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <FlaskConical className="h-8 w-8" />
        <p>No lab investigation results available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SyncTimestamp lastSyncedAt={data.lastSyncedAt} />
      <InvestigationResultsTable dates={data.resultData.dates} tree={tree} />
    </div>
  );
}

function InvestigationResultsTable({ dates, tree }: { dates: string[]; tree: MergedInvestigationNode[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (tree.length === 0) {
    return <p className="py-4 text-center text-muted-foreground">No lab investigation results available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service Name</th>
            {dates.map((date) => (
              <th key={date} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {formatDateTime(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {tree.map((node) => renderRows(node, dates, 0, node.serviceName, collapsed, toggle))}
        </tbody>
      </table>
    </div>
  );
}

function renderRows(
  node: MergedInvestigationNode,
  dates: string[],
  depth: number,
  path: string,
  collapsed: Set<string>,
  toggle: (key: string) => void,
) {
  const isParent = !!node.children;
  const isCollapsed = collapsed.has(path);

  const rows = [
    <tr key={path} className="transition-colors hover:bg-muted/40">
      <td className="px-4 py-3 font-medium" style={{ paddingLeft: 16 + depth * 20 }}>
        {isParent ? (
          <button
            type="button"
            onClick={() => toggle(path)}
            className="inline-flex items-center gap-1.5 text-left"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
            {node.serviceName}
          </button>
        ) : (
          node.serviceName
        )}
      </td>
      {isParent
        ? dates.map((date) => <td key={date} />)
        : dates.map((date) => <ResultCell key={date} result={node.resultsByDate?.[date]} />)}
    </tr>,
  ];

  if (isParent && !isCollapsed) {
    for (const child of node.children ?? []) {
      rows.push(...renderRows(child, dates, depth + 1, `${path}>${child.serviceName}`, collapsed, toggle));
    }
  }

  return rows;
}

function ResultCell({ result }: { result: InvestigationResultValue | undefined }) {
  if (!result || result.value === null || result.value === undefined || result.value === '') {
    return <td className="px-4 py-3 text-muted-foreground">—</td>;
  }

  const isAbnormal = !!result.abnormalFlag && result.abnormalFlag !== 'N';

  return (
    <td className="px-4 py-3">
      <div className={isAbnormal ? 'font-semibold text-red-700' : 'font-medium'}>
        {result.value}
        {result.unit ? ` ${result.unit}` : ''}
      </div>
      {result.referenceRange && (
        <div className="text-[11px] text-muted-foreground">[{result.referenceRange}]</div>
      )}
    </td>
  );
}
