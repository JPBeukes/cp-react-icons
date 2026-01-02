/**
 * Generate SVG string from a rendered icon element with applied colors
 * This function extracts the SVG from a DOM element and applies colors
 * @param padding - Padding percentage (0-0.5, e.g., 0.1 for 10% padding)
 */
export function getSvgStringFromElement(
  iconElement: HTMLElement | null,
  iconColor: string = '#000000',
  bgColor: string = 'transparent',
  size: number = 64,
  padding: number = 0
): string | null {
  if (!iconElement) return null;
  
  // Find the SVG element within the icon (could be direct child or nested)
  const svg = iconElement.querySelector('svg') || (iconElement.tagName === 'svg' ? iconElement : null);
  if (!svg || svg.tagName !== 'svg') return null;
  
  // Clone the SVG to avoid modifying the original
  const clonedSvg = svg.cloneNode(true) as SVGElement;
  
  // Set size attributes
  clonedSvg.setAttribute('width', size.toString());
  clonedSvg.setAttribute('height', size.toString());
  
  // Get or set default viewBox (react-icons usually has viewBox="0 0 24 24")
  let viewBox = clonedSvg.getAttribute('viewBox');
  if (!viewBox) {
    viewBox = '0 0 24 24';
    clonedSvg.setAttribute('viewBox', viewBox);
  }
  
  // Parse viewBox values
  const viewBoxValues = viewBox.split(/\s+/).map(Number);
  if (viewBoxValues.length !== 4) {
    // Invalid viewBox, use default
    viewBoxValues[0] = 0;
    viewBoxValues[1] = 0;
    viewBoxValues[2] = 24;
    viewBoxValues[3] = 24;
  }
  
  const [x, y, width, height] = viewBoxValues;
  
  // Apply padding if specified (padding is a percentage of the icon size)
  let expandedViewBox = { x, y, width, height };
  if (padding > 0 && padding <= 0.5) {
    const paddingAmount = Math.min(width, height) * padding;
    expandedViewBox.x = x - paddingAmount;
    expandedViewBox.y = y - paddingAmount;
    expandedViewBox.width = width + (paddingAmount * 2);
    expandedViewBox.height = height + (paddingAmount * 2);
    
    clonedSvg.setAttribute('viewBox', `${expandedViewBox.x} ${expandedViewBox.y} ${expandedViewBox.width} ${expandedViewBox.height}`);
  }
  
  // Apply icon color to all paths and other elements FIRST
  // This ensures colors are applied before we add background elements
  const applyColor = (element: Element) => {
    // For react-icons Feather icons, paths typically use stroke, NOT fill
    // Apply stroke color to all shape elements
    const strokeValue = element.getAttribute('stroke');
    if (strokeValue === null || strokeValue === '' || strokeValue === 'currentColor') {
      // No stroke or currentColor - set it to icon color
      element.setAttribute('stroke', iconColor);
    } else if (strokeValue !== 'none') {
      // Stroke exists and is not 'none' - override with icon color
      element.setAttribute('stroke', iconColor);
    }
    
    // Only apply fill if the element already has a fill attribute
    // Feather icons don't use fill, so we shouldn't add it if it doesn't exist
    const fillValue = element.getAttribute('fill');
    if (fillValue !== null) {
      // Element has a fill attribute - only override if it's not 'none' or 'transparent'
      if (fillValue !== 'none' && fillValue !== 'transparent' && fillValue !== '') {
        // Override existing fill with icon color
        element.setAttribute('fill', iconColor);
      } else if (fillValue === 'currentColor') {
        // Replace currentColor with actual color
        element.setAttribute('fill', iconColor);
      }
    }
    // If no fill attribute exists, don't add one (Feather icons use stroke only)
    
    // Recursively apply to children
    Array.from(element.children).forEach(applyColor);
  };
  
  // Apply color to all original icon content BEFORE adding background
  // This ensures icon colors are set correctly
  Array.from(clonedSvg.children).forEach(applyColor);
  
  // NOW add background elements (after colors are applied to icon)
  // Apply background color FIRST (before any icon content) if needed
  // This ensures the background is rendered behind the icon
  if (bgColor !== 'transparent') {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', expandedViewBox.x.toString());
    bgRect.setAttribute('y', expandedViewBox.y.toString());
    bgRect.setAttribute('width', expandedViewBox.width.toString());
    bgRect.setAttribute('height', expandedViewBox.height.toString());
    bgRect.setAttribute('fill', bgColor);
    // Insert at the very beginning, before any icon content
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
  }
  
  // Add invisible border rectangle AFTER background (if padding exists)
  // This prevents cropping by defining the full bounds even with transparent background
  if (padding > 0 && padding <= 0.5) {
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', expandedViewBox.x.toString());
    borderRect.setAttribute('y', expandedViewBox.y.toString());
    borderRect.setAttribute('width', expandedViewBox.width.toString());
    borderRect.setAttribute('height', expandedViewBox.height.toString());
    borderRect.setAttribute('fill', '#ffffff');
    borderRect.setAttribute('opacity', '0.001');
    // Insert after background (if exists) but before icon content
    // If background was inserted, it's now firstChild, so insert border after it
    // Otherwise, insert at the beginning
    const insertBefore = bgColor !== 'transparent' 
      ? clonedSvg.firstChild?.nextSibling
      : clonedSvg.firstChild;
    clonedSvg.insertBefore(borderRect, insertBefore);
  }
  
  return clonedSvg.outerHTML;
}

/**
 * Create a data URL from SVG string (for preview or download)
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml,${encoded}`;
}

// Color conversion utilities for complementary color generation

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
  
  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Generate a complementary foreground color from a background color
 * Similar to Tailwind's color shading - keeps the same hue but adjusts lightness
 */
export function generateComplementaryColor(backgroundHex: string): string {
  const hsl = hexToHsl(backgroundHex);
  if (!hsl) return '#64748b'; // Default fallback
  
  let newLightness: number;
  
  // If background is very light (L > 85%), make foreground much darker
  if (hsl.l > 85) {
    newLightness = hsl.l - 45; // Much darker
  } 
  // If background is medium (L 40-85%), make foreground darker by ~40%
  else if (hsl.l > 40) {
    newLightness = hsl.l - 40; // Moderately darker
  } 
  // If background is dark (L < 40%), make foreground lighter
  else {
    newLightness = hsl.l + 30; // Lighter for dark backgrounds
  }
  
  // Clamp lightness between 10% and 90%
  newLightness = Math.max(10, Math.min(90, newLightness));
  
  // Slightly adjust saturation for better contrast (increase if low)
  const newSaturation = hsl.s < 30 ? Math.min(100, hsl.s + 20) : hsl.s;
  
  return hslToHex(hsl.h, newSaturation, newLightness);
}

/**
 * Check if dark mode is active
 */
export function isDarkMode(): boolean {
  // Check for .dark class on document element (Tailwind dark mode)
  if (document.documentElement.classList.contains('dark')) {
    return true;
  }
  
  // Check for prefers-color-scheme media query
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  return false;
}

/**
 * Lighten a color for dark mode
 */
function lightenColor(hex: string, amount: number = 30): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  
  const newLightness = Math.min(90, hsl.l + amount);
  return hslToHex(hsl.h, hsl.s, newLightness);
}

/**
 * Adjust colors for dark mode - swaps background and foreground
 */
export function adjustColorsForDarkMode(
  bg: string, 
  fg: string
): { bg: string; fg: string } {
  if (bg === 'transparent') {
    // For transparent backgrounds, just lighten foreground for dark mode
    return { bg: 'transparent', fg: lightenColor(fg, 20) };
  }
  // Swap colors for dark mode
  return { bg: fg, fg: bg };
}
