import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface SafeImageProps
  extends Omit<ImageProps, 'src' | 'alt'> {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

const FALLBACK_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="400" fill="#f4f4f5"/>
      <g fill="none" stroke="#a1a1aa" stroke-width="2">
        <rect x="120" y="140" width="160" height="120" rx="8"/>
        <circle cx="160" cy="180" r="14"/>
        <path d="M140 240 l40 -40 l40 40 l30 -30 l30 30"/>
      </g>
      <text x="200" y="300" font-family="system-ui,sans-serif" font-size="18"
        fill="#71717a" text-anchor="middle">No image</text>
    </svg>`
  );

/**
 * Drop-in replacement for `next/image` that:
 *  - Coerces `null` / `undefined` / empty-string `src` to a data-URI placeholder
 *    so we never hit the Next 14.2 `next/image` "Cannot read properties of null
 *    (reading 'default')" error from `isStaticRequire`.
 *  - Renders a stylable fallback container (no Next Image) when used with
 *    `fill` and no real image is available.
 */
export default function ProductImage({
  src,
  alt,
  className,
  ...rest
}: SafeImageProps) {
  const hasImage = typeof src === 'string' && src.trim().length > 0;

  if (!hasImage) {
    // Render a plain div with a CSS placeholder so we never hand a bad src
    // to next/image. This is also what avoids the "Cannot read properties
    // of null (reading 'default')" runtime crash in dev mode.
    if (rest.fill) {
      return (
        <div
          role="img"
          aria-label={alt}
          className={cn(
            'flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground',
            className
          )}
          style={{
            backgroundImage: `url("${FALLBACK_SRC}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      );
    }
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-muted text-xs text-muted-foreground',
          className
        )}
        style={{
          minHeight: rest.width ? `${rest.width}px` : '200px',
          minWidth: rest.width ? `${rest.width}px` : '100%',
        }}
      >
        No image
      </div>
    );
  }

  return <Image src={src} alt={alt} className={className} {...rest} />;
}
