"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavbarMain from "../components/NavbarMain";
import { useUser } from "@/hooks/use-user";

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
      router.replace("/app/dashboard");
      return;
    }

    // Restricciones de rol para docentes
    if (user?.rol === "DOCENTE") {
      const allowedRoutes = [
        "/app/dashboard",
        "/app/dashboard/cargar-evaluaciones",
        "/app/dashboard/ver-evaluaciones",
        "/app/dashboard/asignar-notas",
        "/app/dashboard/ver-notas",
      ];
      const isAllowed = allowedRoutes.includes(pathName);
      if (!isAllowed) {
        router.replace("/app/dashboard");
        return;
      }
    }
  }, [user, isLoading, pathName, router]);

  const isPublicPage = !!pathName && !pathName.startsWith("/app") && !pathName.startsWith("/auth");

  return (
    <>
      {isPublicPage && <NavbarMain />}
      {children}
    </>
  );
}
