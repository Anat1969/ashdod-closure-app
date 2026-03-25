export default function StatusBadge({ status }) {
  const map = {
    pending_owner: { label: 'ממתין לבעל עסק', cls: 'bg-blue-100 text-blue-700' },
    pending_review: { label: 'ממתין לבדיקה', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'מאושר', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'נדחה', cls: 'bg-red-100 text-red-600' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
  );
}