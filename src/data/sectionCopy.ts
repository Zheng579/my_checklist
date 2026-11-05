import { makeId } from './defaults';
import { findOpenPosition } from './gridLayout';
import type { ChecklistItem, Section } from '../types';

const copyItems = (items: ChecklistItem[]): ChecklistItem[] =>
  items.map((item) => ({ ...item, id: makeId(), children: copyItems(item.children) }));

/** Create an independent section, with unique identifiers and a free destination. */
export function duplicateSection(source: Section, destination: Section[]): Section {
  const titles = new Set(destination.map((section) => section.title.trim().toLowerCase()));
  const base = source.title.trim() || 'Untitled section';
  let number = 1;
  let title: string;
  do {
    const suffix = number === 1 ? ' (copy)' : ` (copy ${number})`;
    title = `${base.slice(0, 80 - suffix.length)}${suffix}`;
    number++;
  } while (titles.has(title.toLowerCase()));

  const copy: Section = {
    ...source,
    id: makeId(),
    title,
    items: copyItems(source.items),
  };
  return { ...copy, ...findOpenPosition(copy, destination) };
}
