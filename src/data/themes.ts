import type { ThemeName } from '../types';

interface ThemePreset {
  id: Exclude<ThemeName, 'custom'>;
  label: string;
  page: string;
  section: string;
  alternate: string;
  text: string;
  swatches: [string, string];
}

export const themePresets: ThemePreset[] = [
  {
    id: 'spring',
    label: 'Spring',
    page: '#F5F5F5',
    section: '#DCEDC8',
    alternate: '#FFF9C4',
    text: '#1B5E20',
    swatches: ['#74B45F', '#F1C21B'],
  },
  {
    id: 'summer',
    label: 'Summer',
    page: '#F5F5F5',
    section: '#B3E5FC',
    alternate: '#C8E6C9',
    text: '#263238',
    swatches: ['#2B9ED1', '#5CBF27'],
  },
  {
    id: 'autumn',
    label: 'Autumn',
    page: '#F5F5F5',
    section: '#FFB74D',
    alternate: '#FFCCBC',
    text: '#3E2723',
    swatches: ['#D96D16', '#754126'],
  },
  {
    id: 'winter',
    label: 'Winter',
    page: '#F5F5F5',
    section: '#CFD8DC',
    alternate: '#FFFFFF',
    text: '#263238',
    swatches: ['#5C7A8C', '#FFFFFF'],
  },
];
