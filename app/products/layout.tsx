import { ProtectedRoute } from '@/components/auth/protected-route';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}