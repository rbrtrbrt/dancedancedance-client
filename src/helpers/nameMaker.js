const prefixCounts = new Map()

export function uniqueName(prefix, separator="-") {
  let currentCount = prefixCounts.get(prefix) || 0;
  currentCount++;
  prefixCounts.set(prefix,currentCount);
  return prefix+separator+currentCount;
}