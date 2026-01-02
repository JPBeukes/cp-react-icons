import { iconPacks, availablePackIds } from '@/lib/iconData';

interface IconPackSelectorSidebarProps {
  selectedPacks: string[];
  onSelectionChange: (selectedPacks: string[]) => void;
}

export default function IconPackSelectorSidebar({
  selectedPacks,
  onSelectionChange,
}: IconPackSelectorSidebarProps) {
  const handleTogglePack = (packId: string) => {
    const newSelection = selectedPacks.includes(packId)
      ? selectedPacks.filter((id) => id !== packId)
      : [...selectedPacks, packId];
    
    // Ensure at least one pack is selected
    if (newSelection.length === 0) {
      return;
    }
    
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-2">
      {availablePackIds.map((packId) => {
        const pack = iconPacks[packId];
        const isSelected = selectedPacks.includes(packId);
        
        return (
          <label
            key={packId}
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleTogglePack(packId)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{pack.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {pack.icons.length} icons
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}

