export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-foreground/15">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-foreground/70">
        © {new Date().getFullYear()} El Camino Tattoos
      </div>
    </footer>
  );
}
