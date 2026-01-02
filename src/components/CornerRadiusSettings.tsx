import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CornerRadiusSettingsProps {
  value: number; // Corner radius percentage (0-50)
  onChange: (radius: number) => void;
}

const CORNER_RADIUS_PRESETS = [
  { label: 'None', value: 0, key: 'none' },
  { label: 'Rounded', value: 50, key: 'rounded' },
] as const;

export default function CornerRadiusSettings({ value, onChange }: CornerRadiusSettingsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');

  const handlePresetClick = (presetValue: number) => {
    setShowCustom(false);
    setCustomValue('');
    onChange(presetValue);
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    setCustomValue(value.toString());
  };

  const handleCustomChange = (inputValue: string) => {
    setCustomValue(inputValue);
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onChange(numValue);
    }
  };

  const isPresetActive = CORNER_RADIUS_PRESETS.some(
    (preset) => Math.abs(preset.value - value) < 0.1
  );
  const isCustomActive = showCustom && !isPresetActive;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">Corner Radius</label>
      
      {/* Preset buttons */}
      <div className="flex gap-1 flex-wrap">
        {CORNER_RADIUS_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            variant={Math.abs(preset.value - value) < 0.1 ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handlePresetClick(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={isCustomActive ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={handleCustomClick}
        >
          Custom
        </Button>
      </div>

      {/* Custom input */}
      {showCustom && (
        <div className="flex gap-1 items-center">
          <Input
            type="number"
            min="0"
            max="50"
            step="0.1"
            placeholder="0-50%"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="h-8 text-sm"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      )}
    </div>
  );
}

