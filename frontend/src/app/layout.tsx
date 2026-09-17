import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryProvider } from "@/lib/query-provider";
import { BasePathFetch } from "@/components/base-path-fetch";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DFoodie",
  description: "Cafés, restaurants, and food chains on DFoodie.",
  icons: {
    icon: [{ url: withBasePath("/icon.png"), type: "image/png" }],
    apple: withBasePath("/apple-icon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <BasePathFetch />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}