import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import SellerConsentModal from '@/components/SellerConsentModal';

export const metadata: Metadata = {
  title: 'CampusSwap — Verified P2P Student Exchange',
  description: 'A discovery layer for verified college students to buy, sell, or giveaway items safely on campus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>
          {children}
          <SellerConsentModal />
        </AuthProvider>
      </body>
    </html>
  );
}
