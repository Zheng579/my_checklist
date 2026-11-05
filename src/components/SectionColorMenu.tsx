import { useState } from 'react';
import { themePresets } from '../data/themes';
import { useChecklistStore } from '../store/checklistStore';
import type { Section, ThemeName } from '../types';
import { ColorPickerModal } from './ColorPickerDialog';
import { Dropdown } from './Dropdown';

type ColorField = 'textColor' | 'bgColor';
const themeOrder = ['spring', 'autumn', 'summer', 'winter'] as const;

export function SectionColorMenu({ section }: { section: Section }) {
  const applyTheme = useChecklistStore((state) => state.applyTheme);
  const updateSection = useChecklistStore((state) => state.updateSection);
  const [editing, setEditing] = useState<{ field: ColorField; theme: Section['theme'] } | null>(null);

  const selectColorAction = (action: string) => {
    if (action === 'textColor' || action === 'bgColor') {
      setEditing({ field: action, theme: section.theme });
    } else if (themeOrder.some((theme) => theme === action)) {
      applyTheme(section.id, action as Exclude<ThemeName, 'custom'>);
    }
  };

  return (
    <>
      <div className="section-color-menu">
        <Dropdown
          compact
          label={`Colors for ${section.title}`}
          triggerLabel="Colors"
          value={section.theme}
          icon={<span className="color-swatch" style={{ backgroundColor: section.bgColor, color: section.textColor }}>A</span>}
          onSelect={selectColorAction}
          options={[
            ...themeOrder.map((id) => {
              const theme = themePresets.find((theme) => theme.id === id)!;
              return {
                value: id,
                label: theme.label,
                group: 'Theme color',
                icon: <span className="dropdown-theme-preview" style={{ backgroundColor: theme.section, color: theme.text }}>Aa</span>,
              };
            }),
            { value: 'textColor', label: 'Text color', description: section.textColor.toUpperCase(), group: 'Custom colors', icon: <span className="color-swatch" style={{ backgroundColor: section.textColor }} /> },
            { value: 'bgColor', label: 'Background color', description: section.bgColor.toUpperCase(), group: 'Custom colors', icon: <span className="color-swatch" style={{ backgroundColor: section.bgColor }} /> },
          ]}
        />
      </div>
      {editing && (
        <ColorPickerModal
          label={editing.field === 'textColor' ? 'Text color' : 'Background color'}
          value={section[editing.field]}
          onChange={(color) => updateSection(section.id, { [editing.field]: color, theme: 'custom' })}
          onCancel={(originalColor) => {
            if (section[editing.field] !== originalColor || section.theme !== editing.theme) {
              updateSection(section.id, { [editing.field]: originalColor, theme: editing.theme });
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
