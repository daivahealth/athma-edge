import type {
  InvestigationResultValue,
  InvestigationServiceDataNode,
  InvestigationServiceMeta,
} from './types';

export interface MergedInvestigationNode {
  serviceName: string;
  displayOrder: number;
  children?: MergedInvestigationNode[];
  resultsByDate?: Record<string, InvestigationResultValue | undefined>;
}

/**
 * Merges the `services` order/hierarchy metadata with the `data` values,
 * recursing to whatever depth the JSON provides (no fixed-level assumption).
 */
export function buildInvestigationResultTree(
  services: InvestigationServiceMeta[],
  data: Record<string, InvestigationServiceDataNode>,
): MergedInvestigationNode[] {
  return sortByDisplayOrder(services)
    .map((meta) => mergeNode(meta, data[meta.serviceName]))
    .filter((node): node is MergedInvestigationNode => node !== null);
}

function mergeNode(
  meta: InvestigationServiceMeta,
  dataNode: InvestigationServiceDataNode | undefined,
): MergedInvestigationNode | null {
  if (meta.childServices && meta.childServices.length > 0) {
    const childData = dataNode?.childServices ?? {};
    const children = sortByDisplayOrder(meta.childServices)
      .map((childMeta) => mergeNode(childMeta, childData[childMeta.serviceName]))
      .filter((node): node is MergedInvestigationNode => node !== null);

    return {
      serviceName: meta.serviceName,
      displayOrder: meta.displayOrder ?? 0,
      children,
    };
  }

  // Leaf node — render its results by date even if this date's sync had no value for it
  return {
    serviceName: meta.serviceName,
    displayOrder: meta.displayOrder ?? 0,
    resultsByDate: Object.fromEntries(
      Object.entries(dataNode?.results ?? {}).map(([date, entry]) => [date, entry.result]),
    ),
  };
}

function sortByDisplayOrder(services: InvestigationServiceMeta[]): InvestigationServiceMeta[] {
  return [...services].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}
