import { base44 } from '@/api/base44Client';

// Sequential, human-readable ids per year: ASH-2026-001, ASH-2026-002, ...
export async function nextApplicationIds(count = 1) {
  const year = new Date().getFullYear();
  const prefix = `ASH-${year}-`;
  const all = await base44.entities.ClosureApplication.list();
  const max = all
    .map(a => a.application_id)
    .filter(id => typeof id === 'string' && id.startsWith(prefix))
    .map(id => parseInt(id.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return Array.from({ length: count }, (_, i) => `${prefix}${String(max + i + 1).padStart(3, '0')}`);
}

export async function nextApplicationId() {
  return (await nextApplicationIds(1))[0];
}
