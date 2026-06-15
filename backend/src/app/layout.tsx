import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HospitalityHub API",
  description: "Backend API for HospitalityHub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
