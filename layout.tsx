export const metadata = {
  title: 'Radar de Tesorería',
  description: 'Centro de Control de Tesorería',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body style={{margin:0}}>{children}</body></html>;
}
