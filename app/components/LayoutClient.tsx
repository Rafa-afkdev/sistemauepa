"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavbarMain from "../components/NavbarMain";
import { useUser } from "@/hooks/use-user";
import { getFromLocalstorage } from "@/actions/get-from-LocalStorage";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const pathName = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Verificación inmediata del localStorage al montar el componente
  useEffect(() => {
    if (!pathName) return;

    const authRoutes = ["/", "/auth", "/forgot-password"] as const;
    const isInAuthRoute = authRoutes.includes(pathName as any);

    // Verificar localStorage inmediatamente
    const userInLocal = getFromLocalstorage("user");
    
    if (userInLocal && isInAuthRoute) {
      router.replace("/app/dashboard");
      return;
    }

    setIsChecking(false);
  }, [pathName, router]);

  // Verificación adicional cuando el hook useUser carga el usuario
  useEffect(() => {
    if (!pathName) return;

    const authRoutes = ["/", "/auth", "/forgot-password"] as const;
    const isInAuthRoute = authRoutes.includes(pathName as any);

    if (user && isInAuthRoute) {
      router.replace("/app/dashboard");
      return;
    }

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
  }, [user, pathName, router]);

  const isPublicPage = !!pathName && !pathName.startsWith("/app") && !pathName.startsWith("/auth");

  return (
    <>
      {isPublicPage && <NavbarMain />}
      {children}
    </>
  );
}
