export function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/uploads')) return 'http://localhost:3000' + url;
  return url;
}
