import { STATUS_LABELS, STATUS_STYLES } from './constants';

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status || 'לא ידוע';
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>{label}</span>
  );
}
