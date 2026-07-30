import '@/index.css';
import { AppShell } from './AppShell';
import { Providers } from './providers';

export const metadata = {
  title: 'AquaWatch — Water Intelligence Platform',
  description: 'Tank level, flow and weather data flow in continuously → AI predicts shortage risk, flags leaks, and drives smart pump control.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
