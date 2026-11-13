import type { Metadata, Viewport } from "next";
import { Anton, Knewave, Space_Grotesk } from "next/font/google";
import { seo, siteUrl } from "@/lib/content";
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

// What search engines and link previews show. The preview image comes from
// app/opengraph-image.jpg.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  applicationName: "St. John's Hacks",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "St. John's Hacks",
    title: seo.title,
    description: seo.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
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
