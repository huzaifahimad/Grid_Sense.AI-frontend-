import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";

export function AnimatedNumber({ value, decimals = 0, className, style, announce = true }) {
  const animated = useAnimatedNumber(value);
  return (
    <span
      className={`tabular ${className || ""}`}
      style={style}
      aria-hidden={announce ? undefined : true}
    >
      {animated.toFixed(decimals)}
    </span>
  );
}
