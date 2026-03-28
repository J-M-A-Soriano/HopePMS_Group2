import { MainLayout } from "@/components/main-layout";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // M4 (Auth Specialist) Logic:
  // This layout is for authenticated users. The middleware has already verified the session.
  // We can fetch user-specific data here and pass it down if needed.
  return <MainLayout>{children}</MainLayout>;
}
