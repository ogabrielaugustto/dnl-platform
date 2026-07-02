export type DetectionSourceScope = "national" | "international" | "unknown";

type SourceScopeComparable = {
  sourceScope: DetectionSourceScope;
  latestSeenAt: string;
};

type SourceScopeFilterable = {
  sourceScope: DetectionSourceScope;
};

const sourceScopePriority: Record<DetectionSourceScope, number> = {
  national: 0,
  international: 1,
  unknown: 2,
};

export function parseDetectionSourceScope(value: string | null | undefined): DetectionSourceScope {
  if (value === "national" || value === "international") {
    return value;
  }

  return "unknown";
}

export function compareDetectionSourceScope(
  left: SourceScopeComparable,
  right: SourceScopeComparable,
) {
  const byScope =
    sourceScopePriority[left.sourceScope] - sourceScopePriority[right.sourceScope];

  if (byScope !== 0) {
    return byScope;
  }

  return new Date(right.latestSeenAt).getTime() - new Date(left.latestSeenAt).getTime();
}

export function filterByDetectionSourceScope<T extends SourceScopeFilterable>(
  items: T[],
  sourceScope: DetectionSourceScope | null,
) {
  if (!sourceScope) {
    return items;
  }

  return items.filter((item) => item.sourceScope === sourceScope);
}
