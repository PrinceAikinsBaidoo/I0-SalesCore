import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { productImageSrc } from '@/utils/productImageSrc'

export default function ProductThumbnail({
  imageUrl,
  alt = '',
  className,
  fallbackClassName,
  fallback: FallbackIcon,
  size = 36,
}) {
  const src = productImageSrc(imageUrl)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400',
          fallbackClassName,
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {FallbackIcon ? <FallbackIcon size={Math.max(12, Math.round(size * 0.42))} /> : null}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('shrink-0 rounded-lg object-cover bg-slate-50', className)}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
