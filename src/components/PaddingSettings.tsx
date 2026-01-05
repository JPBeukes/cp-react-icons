import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';

interface PaddingSettingsProps {
  value: number; // Padding percentage (0-0.5)
  onChange: (padding: number) => void;
}

const PADDING_PRESETS = [
  { label: 'None', value: 0 },
  { label: 'Small', value: 0.05 },
  { label: 'Medium', value: 0.20 },
  { label: 'Large', value: 0.40 },
] as const;

const MIN_PADDING = 0;
const MAX_PADDING = 0.5;
const STEP = 0.01;

export default function PaddingSettings({ value, onChange }: PaddingSettingsProps) {
  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  // Handle number input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      // Convert percentage to decimal (e.g., 10% -> 0.10)
      const decimalValue = numValue / 100;
      const clampedValue = Math.max(MIN_PADDING, Math.min(MAX_PADDING, decimalValue));
      onChange(clampedValue);
    }
  };

  // Handle preset button click
  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  // Convert value to percentage for display
  const displayValue = (value * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">Padding</label>
      
      {/* Slider */}
      <div>
        <Slider
          min={MIN_PADDING}
          max={MAX_PADDING}
          step={STEP}
          value={[value]}
          onValueChange={handleSliderChange}
          className="w-full"
        />
      </div>

      {/* Number Input */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={MIN_PADDING * 100}
          max={MAX_PADDING * 100}
          step={STEP * 100}
          value={displayValue}
          onChange={handleInputChange}
          className="h-8 text-sm flex-1"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {PADDING_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={Math.abs(preset.value - value) < 0.001 ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handlePresetClick(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

