"use client";

import { NavBar } from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar-";
import { useUser } from "@/hooks/use-user";

export default function DashboardDocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // No mostrar nada si NO es docente (el hook se encargará de redirigir)
  if (user && user.rol && user.rol.toLowerCase() !== "docente") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <div className="hidden xl:flex flex-col w-60 border-r bg-white dark:bg-slate-900">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <NavBar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
