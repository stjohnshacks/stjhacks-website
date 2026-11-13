import type { Metadata, Viewport } from "next";
import { Anton, Knewave, Space_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

// Condensed display face for the big headings.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// Bold, brushy hand-painted face, only for the graffiti on the street.
const paint = Knewave({
  variable: "--font-paint",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "St. John's Hacks",
  description:
    "St. John's Hacks is a student-run hackathon at St. John's University.",
};

export const viewport: Viewport = {
  themeColor: "#050a1a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} ${anton.variable} ${paint.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
