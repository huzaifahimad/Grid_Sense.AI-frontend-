import { useId } from "react";

// One stroke family, one weight, one grid. Anything that reads as an icon in
// this app comes from here; emoji and ad-hoc glyphs are not allowed.
const PATHS = {
  shield: "M12 3.2 5 6v5.2c0 4.3 2.9 7.6 7 9.6 4.1-2 7-5.3 7-9.6V6l-7-2.8Z",
  alert: "M12 4.5 3.6 19h16.8L12 4.5Zm0 4.8v4.4m0 2.6v.2",
  bolt: "M13.4 3 6.6 13.2h4.2L10.2 21l7.2-10.8h-4.4L13.4 3Z",
  radar: "M12 12 18 6.6M12 3.2a8.8 8.8 0 1 0 8.8 8.8M12 7.6a4.4 4.4 0 1 0 4.4 4.4",
  activity: "M3 13h4l2.5-6.5 4 13L16.5 13H21",
  clock: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8ZM12 7.8V12l3 2.1",
  chevron: "m9.5 5.5 6.5 6.5-6.5 6.5",
  target: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm0 4.6a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z",
  layers: "m12 3.6 8.4 4.2L12 12 3.6 7.8 12 3.6Zm-8.4 8.6L12 16.4l8.4-4.2M3.6 16.4 12 20.6l8.4-4.2",
  wave: "M3 14c2.2 0 2.2-5 4.4-5s2.2 5 4.4 5 2.2-5 4.4-5 2.2 5 4.4 5",
  database:
    "M12 4.4c-4.1 0-7.4 1.3-7.4 2.9s3.3 2.9 7.4 2.9 7.4-1.3 7.4-2.9-3.3-2.9-7.4-2.9ZM4.6 7.3v9.4c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9V7.3M4.6 12c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9",
  cpu: "M8 8h8v8H8V8Zm-3.4 2H8m-3.4 4H8m8-6h3.4M16 14h3.4M10 4.6V8m4-3.4V8m-4 8v3.4M14 16v3.4",
  refresh:
    "M20 12a8 8 0 1 1-2.4-5.7M20 4.4V9h-4.6",
  check: "m5 12.6 4.4 4.4L19 7.4",
  info: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm0 3.6v.2m0 3.2V16",
  arrowUp: "M12 19V5.4m0 0-5.4 5.4M12 5.4l5.4 5.4",
  arrowRight: "M4.5 12h15m0 0-5.6-5.6M19.5 12l-5.6 5.6",
  gauge: "M12 13.4 16 9.6M4.4 17.6a8.8 8.8 0 1 1 15.2 0",
  grid: "M4.4 4.4h6.2v6.2H4.4V4.4Zm9 0h6.2v6.2h-6.2V4.4Zm-9 9h6.2v6.2H4.4v-6.2Zm9 0h6.2v6.2h-6.2v-6.2Z",
  spark: "M12 4v4m0 8v4M4 12h4m8 0h4M7 7l2.8 2.8m4.4 4.4L17 17m0-10-2.8 2.8m-4.4 4.4L7 17",
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.6,
  className = "",
  title,
  style,
  ...rest
}) {
  const d = PATHS[name];
  const titleId = useId();
  if (!d) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={style}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      {...rest}
    >
      {title && <title id={titleId}>{title}</title>}
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
