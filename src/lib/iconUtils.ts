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
    
    // Add invisible border rectangle to ensure draw.io respects the full viewBox dimensions
    // This prevents cropping by defining the full bounds even with transparent background
    // Using a very small opacity (0.001) so it's technically visible for bounding box calculations
    // but effectively invisible to the human eye
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', expandedViewBox.x.toString());
    borderRect.setAttribute('y', expandedViewBox.y.toString());
    borderRect.setAttribute('width', expandedViewBox.width.toString());
    borderRect.setAttribute('height', expandedViewBox.height.toString());
    borderRect.setAttribute('fill', '#ffffff');
    borderRect.setAttribute('opacity', '0.001');
    // Insert at the very beginning to ensure it's part of the bounding box calculation
    clonedSvg.insertBefore(borderRect, clonedSvg.firstChild);
  }
  
  // Apply background color if needed
  if (bgColor !== 'transparent') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', expandedViewBox.x.toString());
    rect.setAttribute('y', expandedViewBox.y.toString());
    rect.setAttribute('width', expandedViewBox.width.toString());
    rect.setAttribute('height', expandedViewBox.height.toString());
    rect.setAttribute('fill', bgColor);
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);
  }
  
  // Apply icon color to all paths and other elements
  const applyColor = (element: Element) => {
    // For react-icons, paths typically use stroke, not fill
    // Apply stroke color (most Feather icons use stroke)
    if (element.hasAttribute('stroke')) {
      const strokeValue = element.getAttribute('stroke');
      // Only override if it's not 'none' and not already set to a color
      if (strokeValue !== 'none' && strokeValue !== 'currentColor') {
        element.setAttribute('stroke', iconColor);
      } else if (strokeValue === 'currentColor' || !strokeValue) {
        element.setAttribute('stroke', iconColor);
      }
    }
    
    // Apply fill color if present
    if (element.hasAttribute('fill')) {
      const fillValue = element.getAttribute('fill');
      if (fillValue !== 'none' && fillValue !== 'currentColor') {
        element.setAttribute('fill', iconColor);
      } else if (fillValue === 'currentColor' || !fillValue) {
        element.setAttribute('fill', iconColor);
      }
    }
    
    // Recursively apply to children
    Array.from(element.children).forEach(applyColor);
  };
  
  // Apply color to all child elements
  Array.from(clonedSvg.children).forEach(applyColor);
  
  return clonedSvg.outerHTML;
}

/**
 * Create a data URL from SVG string (for preview or download)
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml,${encoded}`;
}
