/**
 * Apply pack-specific color to a single SVG element (for copying/cloning)
 * @param element - SVG element to apply color to
 * @param color - Color to apply
 * @param packId - Icon pack ID ('feather', 'phosphor', or undefined)
 */
function applyPackSpecificColor(element: Element, color: string, packId?: string): void {
  const tagName = element.tagName.toLowerCase();
  const isShapeElement = ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'].includes(tagName);
  
  if (!isShapeElement && tagName !== 'g') return;
  
  // For groups, remove any stroke/fill attributes (they shouldn't have them)
  // This prevents unwanted borders from group elements
  if (tagName === 'g') {
    element.removeAttribute('stroke');
    element.removeAttribute('fill');
    element.removeAttribute('stroke-width');
  }
  
  switch (packId) {
    case 'feather':
      // Feather: stroke-based icons
      // Only apply to shape elements, not groups
      if (isShapeElement) {
        element.setAttribute('stroke', color);
        element.setAttribute('fill', 'none');
        // Always set stroke-width to 2 for Feather icons to ensure visibility
        // This ensures the icon stroke is always visible regardless of inherited values
        element.setAttribute('stroke-width', '2');
      }
      break;
      
    case 'phosphor':
      // Phosphor: fill-based icons
      element.setAttribute('fill', color);
      if (element.hasAttribute('stroke')) {
        element.setAttribute('stroke', 'none');
      }
      break;
      
    default:
      // Fallback: apply to both if present
      const strokeValue = element.getAttribute('stroke');
      const fillValue = element.getAttribute('fill');
      
      if (strokeValue !== null && strokeValue !== 'none') {
        element.setAttribute('stroke', color);
      }
      if (fillValue !== null && fillValue !== 'none') {
        element.setAttribute('fill', color);
      }
  }
  
  // Remove any style attributes that might contain color overrides
  const styleAttr = element.getAttribute('style');
  if (styleAttr) {
    const cleanedStyle = styleAttr
      .replace(/color\s*:\s*[^;]+;?/gi, '')
      .replace(/stroke\s*:\s*[^;]+;?/gi, '')
      .replace(/fill\s*:\s*[^;]+;?/gi, '')
      .trim();
    if (cleanedStyle) {
      element.setAttribute('style', cleanedStyle);
    } else {
      element.removeAttribute('style');
    }
  }
}

/**
 * Apply pack-specific color to a live SVG element in the DOM (for display)
 * @param svgElement - SVG element in the DOM
 * @param color - Color to apply
 * @param packId - Icon pack ID ('feather', 'phosphor', or undefined)
 */
export function applyPackSpecificColorToSvg(svgElement: SVGElement, color: string, packId?: string): void {
  // Remove any stroke/fill from the SVG element itself (should only be on children)
  svgElement.removeAttribute('stroke');
  svgElement.removeAttribute('fill');
  svgElement.removeAttribute('stroke-width');
  
  const applyColor = (element: Element) => {
    applyPackSpecificColor(element, color, packId);
    // Recursively apply to children
    Array.from(element.children).forEach(applyColor);
  };
  
  // Apply color to all children of the SVG
  Array.from(svgElement.children).forEach(applyColor);
}

/**
 * Generate SVG string from a rendered icon element with applied colors
 * This function extracts the SVG from a DOM element and applies colors
 * @param padding - Padding percentage (0-0.5, e.g., 0.1 for 10% padding)
 * @param cornerRadius - Corner radius percentage (0-50, e.g., 50 for fully rounded/circle)
 * @param packId - Icon pack ID for pack-specific color handling
 */
export function getSvgStringFromElement(
  iconElement: HTMLElement | null,
  iconColor: string = '#000000',
  bgColor: string = 'transparent',
  size: number = 64,
  padding: number = 0,
  cornerRadius: number = 0,
  packId?: string
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
  
  // Remove any color-related attributes from the SVG element itself
  // These will be overridden by the applyColor function on child elements
  clonedSvg.removeAttribute('color');
  // Remove stroke and fill from SVG element itself (should only be on child elements)
  clonedSvg.removeAttribute('stroke');
  clonedSvg.removeAttribute('fill');
  clonedSvg.removeAttribute('stroke-width');
  const svgStyle = clonedSvg.getAttribute('style');
  if (svgStyle) {
    const cleanedStyle = svgStyle
      .replace(/color\s*:\s*[^;]+;?/gi, '')
      .replace(/stroke\s*:\s*[^;]+;?/gi, '')
      .replace(/fill\s*:\s*[^;]+;?/gi, '')
      .trim();
    if (cleanedStyle) {
      clonedSvg.setAttribute('style', cleanedStyle);
    } else {
      clonedSvg.removeAttribute('style');
    }
  }
  
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
  
  // Use provided iconColor directly (don't rely on computed CSS)
  // Apply pack-specific color logic
  const applyColor = (element: Element) => {
    applyPackSpecificColor(element, iconColor, packId);
    // Recursively apply to children
    Array.from(element.children).forEach(applyColor);
  };
  
  // Calculate corner radius in viewBox units
  const containerSize = Math.min(expandedViewBox.width, expandedViewBox.height);
  const radiusInViewBox = (containerSize * cornerRadius) / 100;
  
  // Create defs and clipPath if needed (before processing content)
  let iconGroup: SVGGElement | null = null;
  if (cornerRadius > 0) {
    // Create a clipPath for rounded corners
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'rounded-corner-clip');
    clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    // For stroke-based icons (like Feather), account for stroke width by using a slightly larger clip area
    // Stroke width is typically 2 in viewBox units (24x24 viewBox), so add a small buffer
    const strokeBuffer = packId === 'feather' ? 1 : 0; // Add 1 unit buffer for Feather icons
    clipRect.setAttribute('x', (expandedViewBox.x - strokeBuffer).toString());
    clipRect.setAttribute('y', (expandedViewBox.y - strokeBuffer).toString());
    clipRect.setAttribute('width', (expandedViewBox.width + strokeBuffer * 2).toString());
    clipRect.setAttribute('height', (expandedViewBox.height + strokeBuffer * 2).toString());
    clipRect.setAttribute('rx', radiusInViewBox.toString());
    clipRect.setAttribute('ry', radiusInViewBox.toString());
    // Ensure clipPath rect has no stroke (it's just for clipping, not rendering)
    clipRect.setAttribute('stroke', 'none');
    clipRect.setAttribute('stroke-width', '0');
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    clonedSvg.insertBefore(defs, clonedSvg.firstChild);
    
    // Create a group for icon content with clipPath applied
    // This ensures the clipPath is applied correctly to icon content only
    iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    iconGroup.setAttribute('clip-path', 'url(#rounded-corner-clip)');
  }
  
  // Collect original icon content (before adding background)
  const originalIconContent: Element[] = [];
  Array.from(clonedSvg.children).forEach((child) => {
    if (child.tagName.toLowerCase() !== 'defs') {
      originalIconContent.push(child);
    }
  });
  
  // Apply color to original icon content
  originalIconContent.forEach(applyColor);
  
  // NOW add background elements FIRST (before icon content)
  // This ensures the background is rendered behind the icon
  if (bgColor !== 'transparent') {
    // Create rounded rectangle using a path or rect with rx/ry
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', expandedViewBox.x.toString());
    bgRect.setAttribute('y', expandedViewBox.y.toString());
    bgRect.setAttribute('width', expandedViewBox.width.toString());
    bgRect.setAttribute('height', expandedViewBox.height.toString());
    bgRect.setAttribute('rx', radiusInViewBox.toString());
    bgRect.setAttribute('ry', radiusInViewBox.toString());
    bgRect.setAttribute('fill', bgColor);
    // Explicitly remove any stroke from background rectangle (border should be non-existent)
    bgRect.setAttribute('stroke', 'none');
    bgRect.setAttribute('stroke-width', '0');
    // Insert after defs (if exists)
    const defs = clonedSvg.querySelector('defs');
    if (defs && defs.nextSibling) {
      clonedSvg.insertBefore(bgRect, defs.nextSibling);
    } else if (defs) {
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild?.nextSibling || null);
    } else {
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
    }
  }
  
  // Add invisible border rectangle AFTER background (if padding exists)
  // This prevents cropping by defining the full bounds even with transparent background
  if (padding > 0 && padding <= 0.5) {
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', expandedViewBox.x.toString());
    borderRect.setAttribute('y', expandedViewBox.y.toString());
    borderRect.setAttribute('width', expandedViewBox.width.toString());
    borderRect.setAttribute('height', expandedViewBox.height.toString());
    borderRect.setAttribute('rx', radiusInViewBox.toString());
    borderRect.setAttribute('ry', radiusInViewBox.toString());
    borderRect.setAttribute('fill', '#ffffff');
    borderRect.setAttribute('opacity', '0.001');
    // Ensure no stroke on border rectangle
    borderRect.setAttribute('stroke', 'none');
    borderRect.setAttribute('stroke-width', '0');
    // Insert after background (if exists)
    const defs = clonedSvg.querySelector('defs');
    const bgRect = clonedSvg.querySelector('rect[fill]:not([opacity="0.001"])');
    if (bgRect && bgRect.nextSibling) {
      clonedSvg.insertBefore(borderRect, bgRect.nextSibling);
    } else if (defs && defs.nextSibling) {
      clonedSvg.insertBefore(borderRect, defs.nextSibling);
    } else if (defs) {
      clonedSvg.insertBefore(borderRect, clonedSvg.firstChild?.nextSibling || null);
    } else {
      clonedSvg.insertBefore(borderRect, clonedSvg.firstChild);
    }
  }
  
  // Now add icon content - either in a clipped group or directly
  if (iconGroup) {
    // Move original icon content into the clipped group
    originalIconContent.forEach((child) => {
      iconGroup!.appendChild(child);
    });
    clonedSvg.appendChild(iconGroup);
  }
  // If no clipPath, icon content is already in place (we applied colors to it)
  
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
