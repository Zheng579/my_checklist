import type { ChecklistItem } from '../types';

export const findItem = (items: ChecklistItem[], id: string): ChecklistItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    const match = findItem(item.children, id);
    if (match) return match;
  }
};

export const updateItem = (
  items: ChecklistItem[],
  id: string,
  updater: (item: ChecklistItem) => ChecklistItem,
): ChecklistItem[] =>
  items.map((item) => {
    if (item.id === id) return updater(item);
    if (!item.children.length) return item;
    return { ...item, children: updateItem(item.children, id, updater) };
  });

export const removeItem = (items: ChecklistItem[], id: string): ChecklistItem[] =>
  items
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, children: removeItem(item.children, id) }));

const sortCheckedLast = (items: ChecklistItem[]) =>
  [...items].sort((left, right) => Number(left.checked) - Number(right.checked));

const reconcileTree = (items: ChecklistItem[]): ChecklistItem[] => {
  const reconciled = items.map((item) => {
    if (!item.children.length) return item;
    const children = reconcileTree(item.children);
    return { ...item, children, checked: children.every((child) => child.checked) };
  });
  return sortCheckedLast(reconciled);
};

const flattenDescendants = (item: ChecklistItem): ChecklistItem[] =>
  item.children.flatMap((child) => [child, ...flattenDescendants(child)]);

const mapSubtree = (
  item: ChecklistItem,
  updater: (node: ChecklistItem) => ChecklistItem,
): ChecklistItem => {
  const updated = updater(item);
  return { ...updated, children: updated.children.map((child) => mapSubtree(child, updater)) };
};

export const toggleItemChecked = (items: ChecklistItem[], id: string): ChecklistItem[] => {
  const target = findItem(items, id);
  if (!target) return items;

  let checkboxStateChanged = false;
  const next = updateItem(items, id, (item) => {
    if (!item.children.length) {
      checkboxStateChanged = true;
      return { ...item, checked: !item.checked };
    }

    const descendants = flattenDescendants(item);
    const allChecked = descendants.every((node) => node.checked);
    const allUnchecked = descendants.every((node) => !node.checked);

    if (allChecked || allUnchecked) {
      checkboxStateChanged = true;
      return mapSubtree(item, (node) => ({ ...node, checked: !allChecked }));
    }

    const subtreeHighlighted = [item, ...descendants].every((node) => node.highlighted);
    if (subtreeHighlighted) {
      checkboxStateChanged = true;
      return mapSubtree(item, (node) => ({ ...node, checked: true, highlighted: true }));
    }

    return mapSubtree(item, (node) => ({ ...node, highlighted: true }));
  });

  return checkboxStateChanged ? reconcileTree(next) : next;
};

export const toggleHighlightSubtree = (items: ChecklistItem[], id: string): ChecklistItem[] => {
  const target = findItem(items, id);
  if (!target) return items;
  const highlighted = !target.highlighted;
  return updateItem(items, id, (item) =>
    mapSubtree(item, (node) => ({ ...node, highlighted })),
  );
};

export const reorderSiblings = (
  items: ChecklistItem[],
  parentId: string | null,
  activeId: string,
  overId: string,
): ChecklistItem[] => {
  const reorder = (siblings: ChecklistItem[]) => {
    const oldIndex = siblings.findIndex((item) => item.id === activeId);
    const newIndex = siblings.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return siblings;
    const next = [...siblings];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    return next;
  };

  if (parentId === null) return reorder(items);
  return updateItem(items, parentId, (parent) => ({ ...parent, children: reorder(parent.children) }));
};
