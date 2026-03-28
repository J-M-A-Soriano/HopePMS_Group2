// M2 (Frontend Specialist) Logic:
// This is the main navigation sidebar. It uses the Sidebar primitives
// to create a consistent look and feel. The `usePathname` hook is used
// to highlight the active link.

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Gem,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { UserNav } from "./user-nav";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    // M4 (Auth Specialist) Logic: Logout is handled client-side.
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/products">
              <Gem />
            </Link>
          </Button>
          <span className="truncate font-semibold text-primary">HopePMS</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/products")}
              tooltip="Products"
            >
              <Link href="/products">
                <Package />
                <span>Products</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin")}
              tooltip="Admin"
            >
              <Link href="/admin">
                <ShieldCheck />
                <span>Admin Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="hidden p-2 group-data-[state=expanded]:block">
           <UserNav handleLogout={handleLogout} />
        </div>
        <div className="hidden items-center justify-center p-2 group-data-[state=collapsed]:flex">
            <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut />
            </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
