// FILE: app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { LoginModal } from "@/components/auth/LoginModal"; // Import LoginModal

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axiom",
  description: "Una pagina para estudiantes",
};
const componentStyle = {
  backgroundImage: "url('/background.svg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  minHeight: "100vh",
  // color: "white", // Text color should be handled by components for better contrast
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={componentStyle} // Apply style directly for background
      >
        <AuthProvider>
          {children}
          <LoginModal /> {/* Render LoginModal here so it's globally available */}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
