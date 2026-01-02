import { useRef } from 'react';
import { Button } from './ui/button';
import { FiBox } from 'react-icons/fi';

interface PaddingSettingsProps {
  iconColor: string;
  value: number; // Padding percentage (0-0.5)
  onChange: (padding: number) => void;
}

const PADDING_PRESETS = [
  { label: 'None', value: 0, key: 'none' },
  { label: 'Small', value: 0.05, key: 'sm' },
  { label: 'Medium', value: 0.10, key: 'md' },
  { label: 'Large', value: 0.20, key: 'lg' },
] as const;

const PREVIEW_SIZE = 120;
const PREVIEW_ICON_SIZE = 48;

export default function PaddingSettings({ iconColor, value, onChange }: PaddingSettingsProps) {
  const previewIconRef = useRef<HTMLDivElement>(null);

  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  // Calculate padding in pixels for preview
  // Padding is a percentage of the icon's viewBox (24), so for preview we scale it
  // If icon viewBox is 24 and padding is 10%, that's 2.4 units
  // For preview icon size of 48px, we scale: (48/24) * (24 * padding) = 48 * padding
  const paddingPx = PREVIEW_ICON_SIZE * value;
  const containerSize = PREVIEW_SIZE;
  const iconContainerSize = PREVIEW_ICON_SIZE + (paddingPx * 2);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Padding</label>
      
      {/* Preview */}
      <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/30">
        <div
          className="relative border-2 border-dashed border-muted-foreground/30 rounded bg-background"
          style={{
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Padding visualization - shows the padding area around the icon */}
          {value > 0 && (
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
              width: `${PREVIEW_ICON_SIZE}px`,
              height: `${PREVIEW_ICON_SIZE}px`,
              color: iconColor,
            }}
          >
            <FiBox size={PREVIEW_ICON_SIZE} color={iconColor} />
          </div>

          {/* Percentage label in bottom right corner */}
          <div
            className="absolute bottom-1 right-1 text-xs font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-border/50"
            style={{
              bottom: '4px',
              right: '4px',
            }}
          >
            {(value * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1 flex-wrap">
        {PADDING_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            variant={Math.abs(preset.value - value) < 0.001 ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handlePresetClick(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

