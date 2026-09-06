export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div
      className="px-5 py-1.5 shrink-0 border-b border-critical/30 text-[11.5px] font-mono"
      style={{
        background: "rgba(42, 18, 16, 0.85)",
        backdropFilter: "blur(12px)",
        color: "var(--color-critical)",
      }}
    >
      ⚠ API ERROR — {error}. Confirm `uvicorn api.main:app` is running, or leave
      USE_MOCK_DATA = true.
    </div>
  );
}
