import { Navigation } from '@/components/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
  params?: Promise<Record<string, string>>;
}) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}

