import { useRef } from 'react';
import { FiBox } from 'react-icons/fi';

interface IconPreviewProps {
  iconColor: string;
  backgroundColor?: string;
  padding: number;
  iconSize?: number;
}

const PREVIEW_SIZE = 120;
const PREVIEW_ICON_SIZE = 48;

export default function IconPreview({ 
  iconColor, 
  backgroundColor = 'transparent', 
  padding,
  iconSize = PREVIEW_ICON_SIZE
}: IconPreviewProps) {
  const previewIconRef = useRef<HTMLDivElement>(null);

  // Calculate padding in pixels for preview
  const paddingPx = iconSize * padding;
  const containerSize = PREVIEW_SIZE;
  const iconContainerSize = iconSize + (paddingPx * 2);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center p-2">
        <div
          className="relative border-2 border-dashed border-muted-foreground/30 rounded"
          style={{
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
            backgroundImage: backgroundColor === 'transparent' 
              ? `linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                 linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                 linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                 linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)`
              : undefined,
            backgroundSize: backgroundColor === 'transparent' ? '12px 12px' : undefined,
            backgroundPosition: backgroundColor === 'transparent' 
              ? '0 0, 0 6px, 6px -6px, -6px 0px' 
              : undefined,
          }}
        >
          {/* Padding visualization - shows the padding area around the icon */}
          {padding > 0 && (
            <div
              className="absolute rounded"
              style={{
                width: `${iconContainerSize}px`,
                height: `${iconContainerSize}px`,
                backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue-500 with opacity
                border: '1px dashed rgba(59, 130, 246, 0.3)',
              }}
            />
          )}
          
          {/* Icon container */}
          <div
            ref={previewIconRef}
            className="relative flex items-center justify-center z-10"
            style={{
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              color: iconColor,
            }}
          >
            <FiBox size={iconSize} color={iconColor} />
          </div>

          {/* Percentage label in bottom right corner */}
          <div
            className="absolute bottom-1 right-1 text-xs font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-border/50"
            style={{
              bottom: '4px',
              right: '4px',
            }}
          >
            {(padding * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

