/**
 * Image Optimization Utilities
 *
 * Provides helper functions for optimized image handling with Next.js Image component
 */

/**
 * Generate avatar URL from user data
 * Falls back to Dicebear initials if no avatar provided
 */
export function getAvatarUrl(
  userAvatar: string | undefined,
  userName: string,
  options?: {
    size?: number;
    style?: string;
  }
): string {
  if (userAvatar) {
    return userAvatar;
  }

  const seed = encodeURIComponent(userName);
  const size = options?.size ? `?size=${options.size}` : '';
  const style = options?.style ? `&style=${options.style}` : '';

  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}${size}${style}`;
}

/**
 * Get optimized image sizes for responsive images
 * Useful for setting the Next.js Image component's sizes prop
 */
export const imageSizes = {
  // Avatar sizes
  avatar_sm: '24px',
  avatar_md: '32px',
  avatar_lg: '40px',
  avatar_xl: '64px',

  // Icon sizes
  icon_sm: '16px',
  icon_md: '24px',
  icon_lg: '32px',

  // Card/thumbnail sizes
  thumbnail: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',

  // Full width
  fullWidth: '100vw',
} as const;

/**
 * Get quality setting based on image type and context
 */
export function getImageQuality(context: 'avatar' | 'thumbnail' | 'content' = 'content'): number {
  const qualityMap = {
    avatar: 85,      // Avatars are small, lower quality is acceptable
    thumbnail: 75,   // Thumbnails can use lower quality
    content: 90,     // Full-size content needs better quality
  };
  return qualityMap[context];
}

/**
 * Build Next.js Image component props for common scenarios
 */
export function getImageProps(
  src: string,
  alt: string,
  context: 'avatar' | 'thumbnail' | 'content' = 'content',
  overrides?: Record<string, any>
) {
  const sizeMap = {
    avatar: imageSizes.avatar_md,
    thumbnail: imageSizes.thumbnail,
    content: imageSizes.fullWidth,
  };

  return {
    src,
    alt,
    sizes: sizeMap[context],
    quality: getImageQuality(context),
    priority: false,
    ...overrides,
  };
}

/**
 * Format image URL to ensure it's a valid absolute URL
 */
export function formatImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative URL - return as is (Next.js Image will handle)
  return url;
}

/**
 * Get responsive image sizes string for common layouts
 */
export const responsiveImageSizes = {
  // Hero/banner images
  hero: '(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1200px',

  // Article/blog images
  article: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px',

  // Card images
  cardImage: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',

  // Icon/avatar in lists
  listAvatar: '40px',

  // Profile image
  profileImage: '(max-width: 640px) 60vw, 200px',
} as const;

/**
 * Image format detection and fallback
 */
export const supportedFormats = {
  modern: ['image/avif', 'image/webp'] as const,
  fallback: ['image/jpeg', 'image/png'] as const,
  all: ['image/avif', 'image/webp', 'image/jpeg', 'image/png'] as const,
} as const;
