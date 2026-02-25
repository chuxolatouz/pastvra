import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { SnackProvider } from "@/components/ui/snack";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Pastvra";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: appName,
  description: "PWA para administración de ganado bovino",
  applicationName: appName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appName,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <SnackProvider>
          <ServiceWorkerRegister />
          {children}
        </SnackProvider>
      </body>
    </html>
  );
}
