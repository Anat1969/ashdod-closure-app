import { ExternalLink, FileText } from 'lucide-react';
import { openFile, isImageUrl } from '@/lib/files';

// Clickable file reference that works for data: URLs (which browsers won't open directly).
export default function FileLink({ url, children, className = '', showIcon = true }) {
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={() => openFile(url)}
      className={className || 'inline-flex items-center gap-1 text-xs text-blue-600 underline'}
    >
      {children}
      {showIcon && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
    </button>
  );
}

export function FileThumb({ url, className = 'w-20 h-20', alt = '' }) {
  if (!url) return null;
  return (
    <button type="button" onClick={() => openFile(url)} className={`${className} rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center hover:opacity-80 transition flex-shrink-0`}>
      {isImageUrl(url)
        ? <img src={url} alt={alt} className="w-full h-full object-cover" />
        : <span className="flex flex-col items-center text-gray-500 text-xs gap-1"><FileText className="w-6 h-6" />מסמך</span>}
    </button>
  );
}
