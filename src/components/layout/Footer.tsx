// Phase 5 — Layout: Footer
// Presentational footer stub.
// Copyright/links to be implemented when domain is complete.
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-4 px-6">
      <div className="flex items-center justify-between text-xs text-secondary">
        <p>DeadSubs &copy; {new Date().getFullYear()}</p>
        <p>Version 1.0.0</p>
      </div>
    </footer>
  );
}
