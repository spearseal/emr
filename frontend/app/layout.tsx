import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedSpa KPI Dashboard',
  description: 'GoHighLevel integrated KPI dashboard for MedSpa businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
