import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StadiumOS — Admin Command Center',
  description: 'AI-Agent Powered Adaptive Stadium Intelligence Platform — Admin Dashboard',
  keywords: ['stadium', 'AI', 'crowd intelligence', 'smart venue'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
