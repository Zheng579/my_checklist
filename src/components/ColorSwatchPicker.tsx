import { Check } from 'lucide-react';
import { MATERIAL_COLOR_FAMILIES, MATERIAL_SHADE_LEVELS } from '../data/materialColors';

export interface ColorSwatchPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const normalizeHex = (value: string) => {
  const hex = value.trim().toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(hex)) {
    return `#${hex.slice(1).split('').map((character) => character.repeat(2)).join('')}`;
  }
  return hex;
};

export function ColorSwatchPicker({ label, value, onChange }: ColorSwatchPickerProps) {
  const selectedHex = normalizeHex(value);
  const selectedSwatch = MATERIAL_COLOR_FAMILIES
    .flatMap((family) =>
      family.shades.map((hex, index) => ({ family: family.name, hex, level: MATERIAL_SHADE_LEVELS[index] })),
    )
    .find((swatch) => swatch.hex === selectedHex);

  return (
    <div className="material-swatch-picker">
      <div className="swatch-palette-scroll" role="listbox" aria-label={`${label} Material colors`}>
        <div className="swatch-columns">
          {MATERIAL_COLOR_FAMILIES.map((family) => (
            <div className="swatch-family" key={family.name}>
              <span className="swatch-family-name" title={family.name}>{family.name}</span>
              <div className="swatch-shades">
                {family.shades.map((hex, index) => {
                  const level = MATERIAL_SHADE_LEVELS[index];
                  const selected =
                    selectedSwatch?.family === family.name && selectedSwatch.level === level;
                  return (
                    <button
                      key={`${family.name}-${level}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      aria-label={`${family.name} ${level}, ${hex}`}
                      className={`material-swatch ${selected ? 'material-swatch--selected' : ''}`}
                      style={{ backgroundColor: hex }}
                      onClick={() => onChange(hex)}
                      title={`${family.name} ${level} · ${hex}`}
                    >
                      {selected && <Check size={17} strokeWidth={3} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="selected-color-row" aria-live="polite">
        <span className="selected-color-preview" style={{ backgroundColor: selectedHex }} />
        <span>Selected color</span>
        <output>{selectedHex}</output>
      </div>
    </div>
  );
}
