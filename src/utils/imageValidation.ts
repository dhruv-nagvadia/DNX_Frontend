/**
 * Business/product photos must be raster images — React Native's <Image> can't
 * render SVG, so an SVG would show blank in the mobile app.
 */
export const IMAGE_REJECT_MSG = 'SVG images aren’t supported — please use a JPG, PNG or WEBP image.';

/** True for a raster image file (JPG/PNG/WEBP/GIF…), false for SVG or non-images. */
export function isRasterImage(file: File): boolean {
  if (file.type === 'image/svg+xml') return false;
  if (file.name.toLowerCase().endsWith('.svg')) return false;
  return file.type.startsWith('image/');
}
