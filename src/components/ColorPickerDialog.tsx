import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Move, Palette } from 'lucide-react';
import { Button } from './Button';
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface ColorPickerDialogProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

interface ColorPickerModalProps extends Omit<ColorPickerDialogProps, 'compact'> {
  onClose: () => void;
  onCancel?: (initialColor: string) => void;
}

interface DialogOffset {
  x: number;
  y: number;
}

export function ColorPickerDialog({
  label,
  value,
  onChange,
  compact = false,
}: ColorPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`color-trigger ${compact ? 'color-trigger--compact' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
      >
        <span className="color-swatch" style={{ backgroundColor: value }} />
        {!compact && <span>{label}</span>}
      </button>
      {open && (
        <ColorPickerModal
          label={label}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function ColorPickerModal({
  label,
  value,
  onChange,
  onClose,
  onCancel,
}: ColorPickerModalProps) {
  const [initialColor] = useState(value);
  const [offset, setOffset] = useState<DialogOffset>({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  const cancel = useCallback(() => {
    if (onCancel) onCancel(initialColor);
    else if (value.toUpperCase() !== initialColor.toUpperCase()) onChange(initialColor);
    onClose();
  }, [initialColor, onCancel, onChange, onClose, value]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancel]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !dialogRef.current) return;
    event.preventDefault();
    const bounds = dialogRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = offset;

    const move = (pointerEvent: PointerEvent) => {
      const rawX = pointerEvent.clientX - startX;
      const rawY = pointerEvent.clientY - startY;
      const deltaX = Math.min(
        window.innerWidth - 12 - bounds.right,
        Math.max(12 - bounds.left, rawX),
      );
      const deltaY = Math.min(
        window.innerHeight - 12 - bounds.bottom,
        Math.max(12 - bounds.top, rawY),
      );
      setOffset({ x: startOffset.x + deltaX, y: startOffset.y + deltaY });
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end, { once: true });
  };

  const dialogStyle: CSSProperties = {
    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
  };

  return createPortal(
    <div
      className="color-dialog-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <div
        ref={dialogRef}
        className="color-dialog"
        style={dialogStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`${label} color picker`}
        tabIndex={-1}
      >
        <header className="color-dialog__header" onPointerDown={startDrag}>
          <span className="color-dialog__title">
            <Palette size={18} /> Choose {label.toLowerCase()}
          </span>
          <span className="color-dialog__drag-hint"><Move size={15} /> Drag to move</span>
        </header>

        <div className="color-dialog__body">
          <ColorSwatchPicker label={label} value={value} onChange={onChange} />
        </div>

        <footer className="color-dialog__footer">
          <Button variant="ghost" onClick={cancel}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>OK</Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
