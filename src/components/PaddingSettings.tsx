import { Button } from './ui/button';

interface PaddingSettingsProps {
  value: number; // Padding percentage (0-0.5)
  onChange: (padding: number) => void;
}

const PADDING_PRESETS = [
  { label: 'None', value: 0, key: 'none' },
  { label: 'Small', value: 0.05, key: 'sm' },
  { label: 'Medium', value: 0.10, key: 'md' },
  { label: 'Large', value: 0.20, key: 'lg' },
] as const;

export default function PaddingSettings({ value, onChange }: PaddingSettingsProps) {
  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">Padding</label>
      
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

