import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The element that opens the menu when activated */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownItem[];
  /** Called when an enabled item is selected */
  onSelect: (value: string) => void;
  /** Horizontal alignment of the menu relative to the trigger */
  align?: "left" | "right";
}

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ trigger, items, onSelect, className, align = "left", ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const menuId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
    const containerRef = useClickOutside<HTMLDivElement>(() => close());

    // -- Enableable item indices (skip disabled items during navigation) --
    const enabledIndices = items.reduce<number[]>((acc, item, i) => {
      if (!item.disabled) acc.push(i);
      return acc;
    }, []);

    // ----- Open / Close helpers -----

    const open = useCallback(
      (focusIndex?: number) => {
        setIsOpen(true);
        setActiveIndex(focusIndex ?? enabledIndices[0] ?? -1);
      },
      [enabledIndices],
    );

    const close = useCallback(() => {
      setIsOpen(false);
      setActiveIndex(-1);
      // Restore focus to the trigger
      triggerRef.current?.focus();
    }, []);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (!item || item.disabled) return;
        onSelect(item.value);
        close();
      },
      [items, onSelect, close],
    );

    // ----- Focus the active item whenever activeIndex changes -----

    useEffect(() => {
      if (isOpen && activeIndex >= 0) {
        itemRefs.current[activeIndex]?.focus();
      }
    }, [isOpen, activeIndex]);

    // ----- Navigation helpers -----

    const focusNext = useCallback(() => {
      setActiveIndex((prev) => {
        const currentPos = enabledIndices.indexOf(prev);
        const nextPos =
          currentPos < enabledIndices.length - 1 ? currentPos + 1 : 0;
        return enabledIndices[nextPos] ?? prev;
      });
    }, [enabledIndices]);

    const focusPrev = useCallback(() => {
      setActiveIndex((prev) => {
        const currentPos = enabledIndices.indexOf(prev);
        const prevPos =
          currentPos > 0 ? currentPos - 1 : enabledIndices.length - 1;
        return enabledIndices[prevPos] ?? prev;
      });
    }, [enabledIndices]);

    const focusFirst = useCallback(() => {
      setActiveIndex(enabledIndices[0] ?? -1);
    }, [enabledIndices]);

    const focusLast = useCallback(() => {
      setActiveIndex(enabledIndices[enabledIndices.length - 1] ?? -1);
    }, [enabledIndices]);

    // ----- Trigger keyboard handler -----

    const handleTriggerKeyDown = useCallback(
      (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowDown":
          case "Enter":
          case " ":
            e.preventDefault();
            open(enabledIndices[0]);
            break;
          case "ArrowUp":
            e.preventDefault();
            open(enabledIndices[enabledIndices.length - 1]);
            break;
          default:
            break;
        }
      },
      [open, enabledIndices],
    );

    // ----- Menu keyboard handler -----

    const handleMenuKeyDown = useCallback(
      (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            focusNext();
            break;
          case "ArrowUp":
            e.preventDefault();
            focusPrev();
            break;
          case "Home":
            e.preventDefault();
            focusFirst();
            break;
          case "End":
            e.preventDefault();
            focusLast();
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            if (activeIndex >= 0) selectItem(activeIndex);
            break;
          case "Escape":
            e.preventDefault();
            close();
            break;
          case "Tab":
            // Tab closes the menu without preventing default (focus moves naturally)
            close();
            break;
          default:
            break;
        }
      },
      [activeIndex, close, focusFirst, focusLast, focusNext, focusPrev, selectItem],
    );

    // ----- Merge refs (container: external forwardRef + clickOutside ref) -----

    const mergedContainerRef = useCallback(
      (node: HTMLDivElement | null) => {
        // Assign to useClickOutside ref
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        // Assign to forwarded ref
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref, containerRef],
    );

    return (
      <div ref={mergedContainerRef} className="relative inline-block" {...props}>
        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={handleTriggerKeyDown}
          className="inline-flex"
        >
          {trigger}
        </button>

        {/* Menu */}
        {isOpen && (
          <ul
            id={menuId}
            role="menu"
            aria-label="Actions"
            onKeyDown={handleMenuKeyDown}
            className={cn(
              "absolute z-40 mt-1 min-w-[160px] rounded-lg border border-wealth-border bg-white py-1 shadow-lg",
              "focus:outline-none",
              align === "right" ? "right-0" : "left-0",
              className,
            )}
          >
            {items.map((item, index) => (
              <li
                key={item.value}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="menuitem"
                tabIndex={activeIndex === index ? 0 : -1}
                aria-disabled={item.disabled || undefined}
                onClick={() => !item.disabled && selectItem(index)}
                onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                className={cn(
                  "flex w-full cursor-default items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 outline-none transition-colors",
                  activeIndex === index && "bg-gray-50",
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-50",
                )}
              >
                {item.icon && (
                  <span className="inline-flex shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

Dropdown.displayName = "Dropdown";
