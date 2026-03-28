import React from "react";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/main-sidebar";
import { Header } from "@/components/header";

export function MainLayout({ children }: { children: React.ReactNode }) {
  // M2 (Frontend Specialist) Logic:
  // This component sets up the main application shell using the Sidebar primitives.
  // The sidebar's state (expanded/collapsed) is managed by the SidebarProvider.
  // The 'collapsible' prop can be 'icon' or 'offcanvas'.
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <MainSidebar />
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
