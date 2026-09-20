"use client";

// Last resort: an error the site layout itself couldn't recover from. Replaces
// the root layout, so it brings its own document, fonts and styles, and keeps
// the chrome minimal (the header could be what failed).
import "./globals.css";
import {
  ErrorContent,
  type ErrorContentProps,
} from "@/components/error-content";
import { fontClasses } from "@/lib/fonts";

export default function GlobalError(props: ErrorContentProps) {
  return (
    <html lang="en" className={fontClasses}>
      <body className="site-frame">
        <main className="page">
          <ErrorContent {...props} />
        </main>
      </body>
    </html>
  );
}
