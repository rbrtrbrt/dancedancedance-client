const idCounts = {}

export function newId(name, separator=" ") {
  let currentCount = idCounts[name] || 0;
  currentCount++;
  idCounts[name] = currentCount;
  return name+separator+currentCount;
}