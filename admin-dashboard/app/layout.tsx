import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roominder Admin Dashboard',
  description: 'Modern admin dashboard for Roominder',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
