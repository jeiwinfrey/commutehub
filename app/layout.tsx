import type { Metadata, Viewport } from "next";
import { Varela_Round } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const varela = Varela_Round({
  variable: "--font-varela",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommuteHub",
  description: "Know when your ride comes and when to leave.",
  appleWebApp: { capable: true, title: "CommuteHub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={varela.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
