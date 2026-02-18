"use client";
import { useUser } from "@/hooks/use-user";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import NavbarMain from "../components/NavbarMain";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const pathName = usePathname();
  const router = useRouter();

  // Verificación cuando el usuario y autenticación están listos
  useEffect(() => {
    if (!pathName || isLoading) return;

    const authRoutes = ["/", "/auth", "/forgot-password"] as const;
    const isInAuthRoute = authRoutes.includes(pathName as any);

    // Si hay usuario autenticado y está en ruta de auth, redirigir a dashboard
    if (user && isInAuthRoute) {
      router.replace("/dashboard");
      return;
    }

    // Restricciones de rol para docentes
    if (user?.rol === "DOCENTE") {
      const allowedRoutes = [
        "/dashboard",
        "/dashboard/cargar-evaluaciones",
        "/dashboard/ver-evaluaciones",
        "/dashboard/asignar-notas",
        "/dashboard/ver-notas",
      ];
      // Allow if it's in the specific allowed list OR if it's the teacher dashboard
      const isAllowed = allowedRoutes.includes(pathName) || pathName.startsWith("/dashboard-docente");
      
      if (!isAllowed) {
        // If they are trying to access a restricted /dashboard route, redirect to their main dashboard
        if (pathName.startsWith("/dashboard")) {
             router.replace("/dashboard-docente");
        } else {
             router.replace("/dashboard");
        }
        return;
      }
    }
  }, [user, isLoading, pathName, router]);

  const isPublicPage = !!pathName && !pathName.startsWith("/dashboard") && !pathName.startsWith("/dashboard-docente") && !pathName.startsWith("/auth");

  return (
    <>
      {isPublicPage && <NavbarMain />}
      {children}
    </>
  );
}
