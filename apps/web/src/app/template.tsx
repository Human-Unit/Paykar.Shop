// The root template remounts when the first route segment changes, so the
// entrance plays when moving between sections, not on catalog filters or
// category switches. The shell (header, cart, preferences) keeps its state.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
