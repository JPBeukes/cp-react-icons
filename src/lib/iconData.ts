// Import all Feather icons from react-icons/fi
import * as FiIcons from 'react-icons/fi';
// Import all Phosphor icons from react-icons/pi
import * as PiIcons from 'react-icons/pi';
// Font Awesome 6 icons - commented out for now
// import * as Fa6Icons from 'react-icons/fa6';
import type { IconType } from 'react-icons';

// Create icon metadata array
export interface IconMetadata {
  name: string;
  component: IconType;
  displayName: string;
  packId: string; // Add pack ID to ensure unique keys
}

// Icon pack metadata interface
export interface IconPackMetadata {
  id: string;
  name: string;
  prefix: string; // e.g., "Fi" for Feather, "Pi" for Phosphor
  icons: IconMetadata[];
}

// Helper function to create icon metadata from a pack
function createIconPack(
  id: string,
  name: string,
  prefix: string | string[],
  iconModule: any
): IconPackMetadata {
  // Handle both single prefix and multiple prefixes
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  // Sort prefixes by length (longest first) to match longer prefixes before shorter ones
  // This ensures "FaBrands" matches before "Fa"
  const sortedPrefixes = [...prefixes].sort((a, b) => b.length - a.length);
  
  // Get all icon names from the icon module that match any of the prefixes
  const iconNames = Object.keys(iconModule).filter(
    (key) => {
      const matchesPrefix = sortedPrefixes.some(p => key.startsWith(p));
      return matchesPrefix && typeof iconModule[key] === 'function';
    }
  );

  // Create metadata array
  const icons: IconMetadata[] = iconNames.map((iconName) => {
    const Component = iconModule[iconName];
    // Find which prefix matches (checking longest first) and remove it for display name
    const matchedPrefix = sortedPrefixes.find(p => iconName.startsWith(p)) || sortedPrefixes[0];
    const displayName = iconName.replace(new RegExp(`^${matchedPrefix}`), '');
    
    return {
      name: iconName,
      component: Component,
      displayName,
      packId: id,
    };
  });

  // Sort icons alphabetically by display name
  icons.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    id,
    name,
    prefix: Array.isArray(prefix) ? prefix.join(', ') : prefix,
    icons,
  };
}

// Create icon packs
const featherPack = createIconPack('feather', 'Feather Icons', 'Fi', FiIcons);
const phosphorPack = createIconPack('phosphor', 'Phosphor Icons', 'Pi', PiIcons);
// Font Awesome 6 - commented out for now
// const fa6Pack = createIconPack(
//   'fa6',
//   'Font Awesome 6',
//   ['Fa', 'FaBrands', 'FaRegular', 'FaSolid'],
//   Fa6Icons
// );

// Export icon packs as a record
export const iconPacks: Record<string, IconPackMetadata> = {
  feather: featherPack,
  phosphor: phosphorPack,
  // fa6: fa6Pack,
};

// Get all available pack IDs
export const availablePackIds = Object.keys(iconPacks);

// Helper function to get icons from selected packs
export function getIconsFromPacks(selectedPackIds: string[]): IconMetadata[] {
  const allIcons: IconMetadata[] = [];
  
  selectedPackIds.forEach((packId) => {
    const pack = iconPacks[packId];
    if (pack) {
      allIcons.push(...pack.icons);
    }
  });

  // Sort all icons alphabetically by display name
  allIcons.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return allIcons;
}

// Legacy export for backward compatibility (deprecated, use iconPacks instead)
export const featherIcons = featherPack.icons;

// Export total icon count for reference
export const iconCount = Object.values(iconPacks).reduce(
  (total, pack) => total + pack.icons.length,
  0
);

