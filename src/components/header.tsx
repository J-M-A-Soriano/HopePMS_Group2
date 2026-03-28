// M2 (Frontend Specialist) Logic:
// This is the header component for the main content area.
// It includes the trigger to open the sidebar on mobile devices.
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      {/* The UserNav is shown here on larger screens, but inside the sidebar on mobile */}
      <div className="md:hidden">
        <UserNav />
      </div>
    </header>
  );
}
