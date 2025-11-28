import type { Offering } from './types';

/**
 * Reorders an inventory array by moving an item from one index to another.
 * Returns a new array with the item moved to the new position.
 * 
 * @param inventory - The current inventory array
 * @param fromIndex - The index of the item to move
 * @param toIndex - The destination index for the item
 * @returns A new array with the item reordered
 * 
 * @example
 * // Move item from index 0 to index 2
 * const newInventory = reorderInventory(inventory, 0, 2);
 */
export function reorderInventory(
  inventory: Offering[],
  fromIndex: number,
  toIndex: number
): Offering[] {
  // Return original array if indices are the same (no change needed)
  if (fromIndex === toIndex) {
    return inventory;
  }

  // Return original array if indices are out of bounds
  if (
    fromIndex < 0 ||
    fromIndex >= inventory.length ||
    toIndex < 0 ||
    toIndex >= inventory.length
  ) {
    return inventory;
  }

  // Create a copy of the array to avoid mutation
  const result = [...inventory];
  
  // Remove the item from its original position
  const [removed] = result.splice(fromIndex, 1);
  
  // Insert the item at the new position
  result.splice(toIndex, 0, removed);
  
  return result;
}
