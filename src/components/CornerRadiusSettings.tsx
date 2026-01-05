import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';

interface CornerRadiusSettingsProps {
  value: number; // Corner radius percentage (0-50)
  onChange: (radius: number) => void;
}

const CORNER_RADIUS_PRESETS = [
  { label: 'None', value: 0 },
  { label: 'Rounded', value: 50 },
] as const;

const MIN_RADIUS = 0;
const MAX_RADIUS = 50;
const STEP = 5;

export default function CornerRadiusSettings({ value, onChange }: CornerRadiusSettingsProps) {
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
      const clampedValue = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, numValue));
      onChange(clampedValue);
    }
  };

  // Handle preset button click
  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted-foreground">Corner Radius</label>
      
      {/* Slider */}
      <div>
        <Slider
          min={MIN_RADIUS}
          max={MAX_RADIUS}
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
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          step={STEP}
          value={value}
          onChange={handleInputChange}
          className="h-8 text-sm flex-1"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {CORNER_RADIUS_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={Math.abs(preset.value - value) < 0.1 ? 'default' : 'outline'}
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

