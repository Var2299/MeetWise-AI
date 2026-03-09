import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeetWise AI — Meeting Summarizer',
  description: 'Transform meeting transcripts into structured, actionable summaries with AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
