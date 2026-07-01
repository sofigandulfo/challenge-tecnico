export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 py-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">SubTrack</span>
        <span>© 2026 SubTrack. Precision Subscription Management.</span>
        <a href="/privacy" className="hover:text-foreground transition-colors">
          Privacidad
        </a>
        <a href="/terms" className="hover:text-foreground transition-colors">
          Términos
        </a>
      </div>
    </footer>
  );
}