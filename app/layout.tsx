import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext"; // Adjust path if needed
import { Toaster } from "@/components/ui/sonner"; // Import Toaster


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
  // Add other background properties as needed
  backgroundSize: "cover", // Example: Cover the entire element
  backgroundPosition: "center", // Example: Center the image
  backgroundRepeat: "no-repeat", // Example: Don't repeat the image
  minHeight: "100vh", // Example: Ensure the div takes at least the full viewport height
  color: "white", // Example: Set text color for visibility
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${componentStyle}`}
      >
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" /> {/* Add Toaster here */}
        </AuthProvider>
      </body>
    </html>
  );
}
