import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { getSvgStringFromElement, applyPackSpecificColorToSvg } from '@/lib/iconUtils';
import { copySvgToClipboard, copySvgAsPng } from '@/lib/clipboard';
import { toast } from 'sonner';

interface IconItemProps {
  IconComponent: IconType;
  iconName: string;
  displayName: string;
  packId?: string;
  iconColor: string;
  backgroundColor?: string;
  copyFormat: 'text' | 'png';
  displaySize?: number;
  copySize?: number;
  padding?: number;
  cornerRadius?: number;
}

export default function IconItem({
  IconComponent,
  iconName,
  displayName,
  packId,
  iconColor,
  backgroundColor = 'transparent',
  copyFormat,
  displaySize = 64,
  copySize = 64,
  padding = 0,
  cornerRadius = 0,
}: IconItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [currentFormat, setCurrentFormat] = useState(copyFormat);
  const [currentCopySize, setCurrentCopySize] = useState(copySize);
  const [currentPadding, setCurrentPadding] = useState(padding);
  const [currentCornerRadius, setCurrentCornerRadius] = useState(cornerRadius);

  useEffect(() => {
    // Listen for format changes
    const handleFormatChange = ((e: CustomEvent) => {
      setCurrentFormat(e.detail.format);
    }) as EventListener;

    document.addEventListener('copyFormatChange', handleFormatChange);
    return () => {
      document.removeEventListener('copyFormatChange', handleFormatChange);
    };
  }, []);

  // Update format when prop changes
  useEffect(() => {
    setCurrentFormat(copyFormat);
  }, [copyFormat]);

  // Listen for size changes
  useEffect(() => {
    const handleSizeChange = ((e: CustomEvent) => {
      setCurrentCopySize(e.detail.size);
    }) as EventListener;

    document.addEventListener('iconSizeChange', handleSizeChange);
    return () => {
      document.removeEventListener('iconSizeChange', handleSizeChange);
    };
  }, []);

  // Update size when prop changes
  useEffect(() => {
    setCurrentCopySize(copySize);
  }, [copySize]);

  // Listen for padding changes
  useEffect(() => {
    const handlePaddingChange = ((e: CustomEvent) => {
      setCurrentPadding(e.detail.padding);
    }) as EventListener;

    document.addEventListener('iconPaddingChange', handlePaddingChange);
    return () => {
      document.removeEventListener('iconPaddingChange', handlePaddingChange);
    };
  }, []);

  // Update padding when prop changes
  useEffect(() => {
    setCurrentPadding(padding);
  }, [padding]);

  // Listen for corner radius changes
  useEffect(() => {
    const handleCornerRadiusChange = ((e: CustomEvent) => {
      setCurrentCornerRadius(e.detail.radius);
    }) as EventListener;

    document.addEventListener('iconCornerRadiusChange', handleCornerRadiusChange);
    return () => {
      document.removeEventListener('iconCornerRadiusChange', handleCornerRadiusChange);
    };
  }, []);

  // Update corner radius when prop changes
  useEffect(() => {
    setCurrentCornerRadius(cornerRadius);
  }, [cornerRadius]);

  // Apply pack-specific colors to SVG for display
  useEffect(() => {
    if (!iconRef.current || !packId) return;
    const svg = iconRef.current.querySelector('svg');
    if (!svg) return;
    
    // Apply pack-specific colors to SVG for display
    applyPackSpecificColorToSvg(svg, iconColor, packId);
  }, [iconColor, packId, IconComponent]);

  const handleClick = async () => {
    try {
      if (!iconRef.current) return;

      const svgString = getSvgStringFromElement(
        iconRef.current,
        iconColor,
        backgroundColor,
        copySize,
        currentPadding,
        currentCornerRadius,
        packId
      );

      if (svgString) {
        try {
          let formatName = '';
          if (currentFormat === 'png') {
            // Copy as PNG image
            await copySvgAsPng(svgString, copySize);
            formatName = 'PNG image';
          } else {
            // Copy as SVG (uses ClipboardItem API)
            await copySvgToClipboard(svgString);
            formatName = 'SVG';
          }

          // Show success toast
          toast.success(`${displayName} icon copied as ${formatName} to clipboard`, {
            duration: 3000,
          });

          // Show visual feedback
          if (containerRef.current) {
            const originalBg = containerRef.current.style.backgroundColor;
            containerRef.current.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.style.backgroundColor = originalBg;
              }
            }, 500);
          }
        } catch (copyError: any) {
          console.error('Failed to copy icon:', copyError);
          
          // Show user-friendly error toast
          let errorMessage = 'Failed to copy icon to clipboard';
          if (copyError.message) {
            if (copyError.message.includes('not supported')) {
              errorMessage = 'Your browser doesn\'t support copying files. Try copying as SVG or PNG instead.';
            } else if (copyError.message.includes('permissions')) {
              errorMessage = 'Clipboard permission denied. Please allow clipboard access and try again.';
            } else {
              errorMessage = copyError.message;
            }
          }
          
          toast.error(errorMessage, {
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Failed to process icon:', error);
      toast.error('Failed to process icon. Please try again.', {
        duration: 4000,
      });
    }
  };

  const formatLabel = currentFormat === 'png' ? 'png' : 'svg';
  const sizeLabel = `${currentCopySize}px`;

  // Truncate text in the middle if too long
  const truncateMiddle = (text: string, maxLength: number = 17): string => {
    if (text.length <= maxLength) {
      return text;
    }
    // Show roughly equal parts at start and end (e.g., "Address...Duotone")
    const availableLength = maxLength - 3; // Subtract 3 for "..."
    const startLength = Math.floor(availableLength / 2);
    const endLength = availableLength - startLength;
    return `${text.slice(0, startLength)}...${text.slice(-endLength)}`;
  };

  // Calculate visual padding and corner radius
  const paddingPx = displaySize * currentPadding;
  const backgroundSize = displaySize + (paddingPx * 2);
  const cornerRadiusPx = (backgroundSize * currentCornerRadius) / 100;

  return (
    <div
      ref={containerRef}
      className="icon-item group cursor-pointer p-2 border rounded-lg bg-white hover:border-primary hover:shadow-md transition-all relative"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* Icon wrapper with background, padding, and corner radius */}
        <div
          className="relative flex items-center justify-center"
          style={{ 
            width: `${backgroundSize}px`, 
            height: `${backgroundSize}px`,
          }}
        >
          {/* Background div - positioned behind icon */}
          {backgroundColor !== 'transparent' && (
            <div
              className="absolute inset-0"
              style={{
                width: `${backgroundSize}px`,
                height: `${backgroundSize}px`,
                backgroundColor: backgroundColor,
                borderRadius: `${cornerRadiusPx}px`,
              }}
            />
          )}
          {/* Icon container with CSS color for currentColor */}
          <div
            ref={iconRef}
            className="relative flex items-center justify-center z-10"
            style={{ 
              color: iconColor,
              width: `${displaySize}px`,
              height: `${displaySize}px`,
            }}
          >
            {IconComponent ? (
              <IconComponent size={displaySize} />
            ) : (
              <div className="w-full h-full bg-muted animate-pulse rounded" />
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground text-center truncate w-full" title={displayName}>
          {truncateMiddle(displayName)}
        </span>
      </div>
      {/* Hover label showing copy mode and size */}
      <div className="absolute top-0 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-border">
          {sizeLabel}, {formatLabel}
        </span>
      </div>
    </div>
  );
}

