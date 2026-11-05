import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: ReactNode;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  value?: string;
  placeholder?: string;
  triggerLabel?: string;
  icon?: ReactNode;
  compact?: boolean;
}

/** Shared accessible menu for page selection and container color actions. */
export function Dropdown({ label, options, onSelect, value, placeholder = 'Select', triggerLabel, icon, compact = false }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 260, maxHeight: 360 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const selected = options.find((option) => option.value === value);

  const openMenu = () => {
    setFocusedIndex(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const reposition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      const width = Math.min(Math.max(bounds.width, 260), window.innerWidth - 24);
      const below = window.innerHeight - bounds.bottom - 20;
      const height = Math.min(menuRef.current?.scrollHeight ?? 360, 360);
      const above = below < Math.min(height, 180) && bounds.top > below;
      const maxHeight = Math.max(100, Math.min(360, above ? bounds.top - 20 : below));
      setPosition({
        left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)),
        top: above ? Math.max(12, bounds.top - Math.min(height, maxHeight) - 6) : bounds.bottom + 6,
        width,
        maxHeight,
      });
    };
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[focusedIndex]?.focus({ preventScroll: true });
    optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, open]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener('pointerdown', dismiss);
    return () => window.removeEventListener('pointerdown', dismiss);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') {
      closeMenu();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setFocusedIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[focusedIndex];
      if (option) {
        closeMenu(true);
        onSelect(option.value);
      }
    } else if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      const index = options.findIndex((option, index) => index > focusedIndex && option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      const fallback = options.findIndex((option) => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (index >= 0 || fallback >= 0) setFocusedIndex(index >= 0 ? index : fallback);
    }
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`dropdown-trigger ${compact ? 'dropdown-trigger--compact' : ''}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => open ? closeMenu() : openMenu()}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        {icon && <span className="dropdown-trigger__icon">{icon}</span>}
        <span className="dropdown-trigger__label">{triggerLabel ?? selected?.label ?? placeholder}</span>
        <ChevronDown size={15} className={open ? 'dropdown-chevron--open' : ''} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          className="dropdown-menu"
          style={position}
          role="listbox"
          aria-label={label}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            <div key={option.value} role="presentation">
              {option.group && options[index - 1]?.group !== option.group && (
                <div className="dropdown-menu__heading" role="presentation">{option.group}</div>
              )}
              <button
                type="button"
                ref={(element) => { optionRefs.current[index] = element; }}
                className={`dropdown-option ${value === option.value ? 'dropdown-option--selected' : ''}`}
                role="option"
                aria-selected={value === option.value}
                tabIndex={index === focusedIndex ? 0 : -1}
                onClick={() => {
                  closeMenu(true);
                  onSelect(option.value);
                }}
              >
                {option.icon && <span className="dropdown-option__icon">{option.icon}</span>}
                <span className="dropdown-option__text">
                  <strong>{option.label}</strong>
                  {option.description && <small>{option.description}</small>}
                </span>
                {value === option.value && <Check size={16} className="dropdown-option__check" />}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
