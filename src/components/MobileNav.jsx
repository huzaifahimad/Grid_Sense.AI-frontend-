import { useEffect, useState } from "react";
import { FONT_MONO, C } from "../config/tokens.js";
import { Icon } from "./Icon.jsx";
import { prefersReducedMotion } from "../hooks/useMediaQuery.js";

const TABS = [
  { id: "m-risk", label: "RISK", icon: "gauge" },
  { id: "m-load", label: "LOAD", icon: "activity" },
  { id: "m-feeds", label: "FEEDS", icon: "radar" },
  { id: "m-grid", label: "GRID", icon: "grid" },
];

/**
 * Thumb-reach navigation for the single-column layout. The page is a long
 * scroll on a phone, so the four sections a reviewer actually asks about get a
 * persistent bar instead of being found by scrolling.
 */
export function MobileNav() {
  const [active, setActive] = useState(TABS[0].id);

  useEffect(() => {
    const els = TABS.map((t) => document.getElementById(t.id)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (shown) setActive(shown.target.id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Dashboard sections"
      className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 lg:hidden"
    >
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => go(t.id)}
            aria-current={on ? "true" : undefined}
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
