import { useRef } from 'react';
import { FiBox } from 'react-icons/fi';

interface IconPreviewProps {
  iconColor: string;
  backgroundColor?: string;
  padding: number;
  cornerRadius?: number;
  iconSize?: number;
}

const PREVIEW_SIZE = 120;
const PREVIEW_ICON_SIZE = 48;

export default function IconPreview({ 
  iconColor, 
  backgroundColor = 'transparent', 
  padding,
  cornerRadius = 0,
  iconSize = PREVIEW_ICON_SIZE
}: IconPreviewProps) {
  const previewIconRef = useRef<HTMLDivElement>(null);

  // Calculate padding in pixels for preview
  const paddingPx = iconSize * padding;
  const containerSize = PREVIEW_SIZE;
  const iconContainerSize = iconSize + (paddingPx * 2);
  
  // Calculate corner radius in pixels (percentage of container size)
  const cornerRadiusPx = (iconContainerSize * cornerRadius) / 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center p-2">
        <div
          className="relative border-2 border-dashed border-muted-foreground/30 rounded bg-muted/30"
          style={{
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Preview background - shows the actual background color */}
          <div
            className="absolute border border-muted-foreground/30"
            style={{
              width: `${iconContainerSize}px`,
              height: `${iconContainerSize}px`,
              backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
              borderRadius: `${cornerRadiusPx}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          
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
        </div>
      </div>
    </div>
  );
}

