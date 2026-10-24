import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LPKS Fujisaki Gakuin Center",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
