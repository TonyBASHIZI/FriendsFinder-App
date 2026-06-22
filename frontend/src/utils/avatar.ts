export function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/uploads')) return (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000') + url;
  return url;
}
