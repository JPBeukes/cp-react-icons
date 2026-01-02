import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { getSvgStringFromElement } from '@/lib/iconUtils';
import { copySvgToClipboard, copySvgAsPng } from '@/lib/clipboard';
import { toast } from 'sonner';

interface IconItemProps {
  IconComponent: IconType;
  iconName: string;
  displayName: string;
  iconColor: string;
  copyFormat: 'text' | 'png';
  displaySize?: number;
  copySize?: number;
  padding?: number;
}

export default function IconItem({
  IconComponent,
  iconName,
  displayName,
  iconColor,
  copyFormat,
  displaySize = 64,
  copySize = 64,
  padding = 0,
}: IconItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [currentFormat, setCurrentFormat] = useState(copyFormat);
  const [currentCopySize, setCurrentCopySize] = useState(copySize);
  const [currentPadding, setCurrentPadding] = useState(padding);

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

  const handleClick = async () => {
    try {
      if (!iconRef.current) return;

      const svgString = getSvgStringFromElement(
        iconRef.current,
        iconColor,
        'transparent',
        copySize,
        currentPadding
      );

      if (svgString) {
        try {
          let formatName = '';
          if (currentFormat === 'png') {
            // Copy as PNG image
            await copySvgAsPng(svgString, copySize);
            formatName = 'PNG image';
          } else {
            // Copy as SVG file (now uses ClipboardItem API)
            await copySvgToClipboard(svgString);
            formatName = 'SVG file';
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
              errorMessage = 'Your browser doesn\'t support copying files. Try copying as SVG text or PNG instead.';
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

  return (
    <div
      ref={containerRef}
      className="icon-item group cursor-pointer p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all relative"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          ref={iconRef}
          className="flex items-center justify-center"
          style={{ color: iconColor, width: `${displaySize}px`, height: `${displaySize}px` }}
        >
          {IconComponent ? (
            <IconComponent size={displaySize} color={iconColor} />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse rounded" />
          )}
        </div>
        <span className="text-xs text-muted-foreground text-center">
          {displayName}
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

