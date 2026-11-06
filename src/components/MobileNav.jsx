import { FONT_MONO, C } from "../config/tokens.js";
import { Icon } from "./Icon.jsx";

export const PHONE_TABS = [
  { id: "risk", label: "RISK", icon: "gauge" },
  { id: "load", label: "LOAD", icon: "activity" },
  { id: "feeds", label: "FEEDS", icon: "radar" },
  { id: "grid", label: "GRID", icon: "grid" },
  { id: "report", label: "REPORT", icon: "layers" },
];

const KEYS = {
  ArrowRight: (i) => (i + 1) % PHONE_TABS.length,
  ArrowLeft: (i) => (i - 1 + PHONE_TABS.length) % PHONE_TABS.length,
  Home: () => 0,
  End: () => PHONE_TABS.length - 1,
};

/**
 * Tab bar for the single-column layout. Each entry selects a view rather than
 * scrolling to a section, so the reviewer navigates without a long page; the
 * selected view is mounted by App and this bar holds no state of its own.
 */
export function MobileNav({ active, onChange }) {
  const onKeyDown = (e) => {
    const move = KEYS[e.key];
    if (!move) return;
    e.preventDefault();
    const next = PHONE_TABS[move(PHONE_TABS.findIndex((t) => t.id === active))];
    onChange(next.id);
    // Focus follows selection, as the tabs pattern requires: otherwise the next
    // arrow key goes to the tab originally clicked, not the one now visible.
    document.getElementById(`phone-tab-${next.id}`)?.focus();
  };

  return (
    <nav
      role="tablist"
      aria-label="Dashboard views"
      onKeyDown={onKeyDown}
      className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 lg:hidden"
    >
      {PHONE_TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            id={`phone-tab-${t.id}`}
            type="button"
            role="tab"
            // Not aria-current: a tab selection is not a location, and screen
            // readers announce the tab pattern from role + aria-selected.
            aria-selected={on}
            aria-controls={`phone-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 outline-offset-[-2px]"
            style={{ color: on ? C.cyan : "var(--color-txt-muted)" }}
          >
            <span
              aria-hidden="true"
              className="absolute top-0 h-[2px] w-9 rounded-pill origin-center transition-transform duration-300 ease-out"
              style={{ background: C.cyan, transform: on ? "scaleX(1)" : "scaleX(0)" }}
            />
            <Icon name={t.icon} size={19} strokeWidth={on ? 2 : 1.5} />
            <span
              className="text-2xs tracking-label uppercase font-bold"
              style={{ fontFamily: FONT_MONO }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
