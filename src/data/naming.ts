/**
 * Returns the next predictable label for a collection.
 * Only labels generated for the same collection type participate, so custom
 * names do not make the first generated label skip "1".
 */
export const nextNumberedLabel = (base: string, existingLabels: string[]): string => {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const generatedLabelPattern = new RegExp(`^${escapedBase}\\s+(\\d+)$`, 'i');
  const highestExistingNumber = existingLabels.reduce((highest, label) => {
    const match = label.trim().match(generatedLabelPattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${base} ${highestExistingNumber + 1}`;
};
