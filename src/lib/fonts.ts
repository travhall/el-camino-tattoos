import { Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";

// Body text. Variable weight axis.
export const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Headings and display type. Variable weight axis: 100-900.
export const cosmic = localFont({
  src: "../../public/fonts/Cosmic-VF.woff2",
  variable: "--font-cosmic",
  weight: "100 900",
  display: "swap",
});

/** Class names that define both font CSS variables; put them on <html>. */
export const fontClasses = `${hankenGrotesk.variable} ${cosmic.variable}`;
