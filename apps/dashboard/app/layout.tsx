import '../styles/globals.css';
export const metadata = {
  title: 'Core Banking Dashboard',
  description: 'Monitoreo en tiempo real del sistema financiero',
};
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';
import TopNav from './components/TopNav';
import SideNav from './components/SideNav';
import BrandBackground from './components/BrandBackground';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
        <ThemeProvider>
          <QueryProvider>
            <BrandBackground />
            <TopNav />
            <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
              <SideNav />
              <main className="flex-1">{children}</main>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
