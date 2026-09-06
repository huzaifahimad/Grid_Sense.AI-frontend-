import { useAnimatedNumber } from "../hooks/useAnimatedNumber.js";

export function AnimatedNumber({ value, decimals = 0, className, style }) {
  const animated = useAnimatedNumber(value);
  return (
    <span className={`tabular ${className || ""}`} style={style}>
      {animated.toFixed(decimals)}
    </span>
  );
}
