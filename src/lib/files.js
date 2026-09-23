// Helpers for files stored as data: URLs in the browser.

export function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:')) return url.startsWith('data:image/');
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

export function isPdfUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(url);
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.slice(5).split(';')[0] || 'application/octet-stream';
  const isBase64 = header.includes(';base64');
  const raw = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Browsers block opening data: URLs in a new tab, so convert to a blob: URL first.
export function openFile(url) {
  if (!url) return;
  if (!url.startsWith('data:')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const blobUrl = URL.createObjectURL(dataUrlToBlob(url));
  const win = window.open(blobUrl, '_blank');
  if (!win) {
    // Popup blocked: fall back to downloading the file.
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'file';
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
