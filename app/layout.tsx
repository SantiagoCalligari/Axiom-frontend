import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { LoginModal } from "@/components/auth/LoginModal";
import { Header } from "@/components/Header";

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
        style={componentStyle}
      >
        <AuthProvider>
          <Header />
          {children}
          <LoginModal />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
