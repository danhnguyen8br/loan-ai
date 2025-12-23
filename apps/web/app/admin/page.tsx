import { redirect } from 'next/navigation';

export default function AdminDashboard(_props: {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect('/admin/templates');
}
