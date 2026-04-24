/**
 * Browser URL for a product image. Paths such as `/product-images/opt/...` are served from the
 * SPA host (Vite `public/` or the static CDN), not from the Java API — do not prefix the API base URL.
 */
export function productImageSrc(imageUrl) {
  if (imageUrl == null) return null
  const s = String(imageUrl).trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  return s.startsWith('/') ? s : `/${s}`
}
