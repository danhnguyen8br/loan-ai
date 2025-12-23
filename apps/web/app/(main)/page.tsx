import { redirect } from 'next/navigation';

export default function Home(_props: {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect('/simulator');
}

