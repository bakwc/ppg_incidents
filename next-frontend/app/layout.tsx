import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Script from "next/script";

export const metadata: Metadata = {
  title: "PPG Incidents",
  description: "Database of paramotor incidents with statistical analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script 
          defer 
          src="https://analytics.q7.su/script.js" 
          data-website-id="5b9c6d79-3786-4d7e-a33b-59ea3a1f1718"
        />
      </head>
      <body className="bg-slate-950 text-slate-100">
        <AuthProvider>
          <div className="min-h-screen">
            <Navigation />
            {children}
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
