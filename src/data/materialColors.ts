export const MATERIAL_SHADE_LEVELS = [900, 700, 500, 300, 100] as const;

export interface MaterialColorFamily {
  name: string;
  shades: readonly [string, string, string, string, string];
}

/** Material Design shades ordered from darkest (900) to lightest (100). */
export const MATERIAL_COLOR_FAMILIES: readonly MaterialColorFamily[] = [
  { name: 'Red', shades: ['#B71C1C', '#D32F2F', '#F44336', '#E57373', '#FFCDD2'] },
  { name: 'Pink', shades: ['#880E4F', '#C2185B', '#E91E63', '#F06292', '#F8BBD0'] },
  { name: 'Purple', shades: ['#4A148C', '#7B1FA2', '#9C27B0', '#BA68C8', '#E1BEE7'] },
  { name: 'Deep Purple', shades: ['#311B92', '#512DA8', '#673AB7', '#9575CD', '#D1C4E9'] },
  { name: 'Indigo', shades: ['#1A237E', '#303F9F', '#3F51B5', '#7986CB', '#C5CAE9'] },
  { name: 'Blue', shades: ['#0D47A1', '#1976D2', '#2196F3', '#64B5F6', '#BBDEFB'] },
  { name: 'Light Blue', shades: ['#01579B', '#0288D1', '#03A9F4', '#4FC3F7', '#B3E5FC'] },
  { name: 'Cyan', shades: ['#006064', '#0097A7', '#00BCD4', '#4DD0E1', '#B2EBF2'] },
  { name: 'Teal', shades: ['#004D40', '#00796B', '#009688', '#4DB6AC', '#B2DFDB'] },
  { name: 'Green', shades: ['#1B5E20', '#388E3C', '#4CAF50', '#81C784', '#C8E6C9'] },
  { name: 'Light Green', shades: ['#33691E', '#689F38', '#8BC34A', '#AED581', '#DCEDC8'] },
  { name: 'Lime', shades: ['#827717', '#AFB42B', '#CDDC39', '#DCE775', '#F0F4C3'] },
  { name: 'Yellow', shades: ['#F57F17', '#FBC02D', '#FFEB3B', '#FFF176', '#FFF9C4'] },
  { name: 'Amber', shades: ['#FF6F00', '#FFA000', '#FFC107', '#FFD54F', '#FFECB3'] },
  { name: 'Orange', shades: ['#E65100', '#F57C00', '#FF9800', '#FFB74D', '#FFE0B2'] },
  { name: 'Deep Orange', shades: ['#BF360C', '#E64A19', '#FF5722', '#FF8A65', '#FFCCBC'] },
  { name: 'Brown', shades: ['#3E2723', '#5D4037', '#795548', '#A1887F', '#D7CCC8'] },
  { name: 'Grey', shades: ['#212121', '#616161', '#9E9E9E', '#E0E0E0', '#F5F5F5'] },
  { name: 'Blue Grey', shades: ['#263238', '#455A64', '#607D8B', '#90A4AE', '#CFD8DC'] },
  { name: 'Black / White', shades: ['#000000', '#212121', '#9E9E9E', '#F5F5F5', '#FFFFFF'] },
] as const;
