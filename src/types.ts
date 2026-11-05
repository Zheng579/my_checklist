export type ChecklistLevel = 1 | 2 | 3 | 4 | 5;
export type ThemeName = 'custom' | 'spring' | 'summer' | 'autumn' | 'winter';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  expanded: boolean;
  highlighted: boolean;
  level: ChecklistLevel;
  children: ChecklistItem[];
}

export interface Section {
  id: string;
  title: string;
  width: number;
  height: number;
  minHeight?: number;
  column?: number;
  row?: number;
  bgColor: string;
  textColor: string;
  theme?: ThemeName;
  items: ChecklistItem[];
}

export interface ChecklistPage {
  id: string;
  title: string;
  backgroundColor: string;
  sections: Section[];
}

export interface ChecklistData {
  version: 1;
  activePageId: string;
  theme: ThemeName;
  pages: ChecklistPage[];
}
