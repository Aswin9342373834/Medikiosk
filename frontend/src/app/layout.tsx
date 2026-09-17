import './globals.css';
import { LanguageProvider } from '../contexts/LanguageContext';

export const metadata = {
  title: 'MediKiosk | AI Clinical Intake Platform',
  description: 'AI-Powered Clinical History & Medical Document Intake Platform for Indian Government Hospitals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="font-sans antialiased text-slate-900 bg-slate-50">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}