"use client";

import { getFromLocalstorage } from "@/actions/get-from-LocalStorage";
import { setInLocalstorage } from "@/actions/set-in-LocalStorage";
import { User } from "@/interfaces/users.interface";
import { auth, getDocument } from "@/lib/data/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { DocumentData } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useUser = () => {
  const [user, setUser] = useState<User | undefined | DocumentData>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const pathName = usePathname();
  const route = useRouter();

  const getUserFromDB = async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const res = await getDocument(path);
      setUser(res);
      setInLocalstorage("user", res);
      return res;
    } catch (error) {
      console.error("Error fetching user from database:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      //? SI EL USUARIO ESTÁ AUTENTICADO
      if (authUser) {
        const userInLocal = getFromLocalstorage("user");
        let userData = userInLocal;
        
        if (!userInLocal) {
          userData = await getUserFromDB(authUser.uid);
        }
        
        setUser(userData);
        setIsLoading(false);

        // Redirigir según el rol del usuario
        if (userData && userData.rol) {
          const rolLower = userData.rol.toLowerCase();
          const isDocente = rolLower === "docente";
          
          console.log("=== DEBUG USE-USER ===");
          console.log("Usuario rol original:", userData.rol);
          console.log("Usuario rol toLowerCase:", rolLower);
          console.log("Es docente:", isDocente);
          console.log("Ruta actual:", pathName);
          console.log("pathName === '/auth':", pathName === "/auth");
          console.log("pathName.startsWith('/auth/'):", pathName.startsWith("/auth/"));
          console.log("pathName.startsWith('/app/dashboard'):", pathName.startsWith("/app/dashboard"));
          console.log("pathName.startsWith('/app/dashboard-docente'):", pathName.startsWith("/app/dashboard-docente"));
          console.log("======================");
          
          // Si está en auth, redirigir al dashboard correspondiente
          if (pathName === "/auth" || pathName.startsWith("/auth/")) {
            const targetRoute = isDocente ? "/app/dashboard-docente" : "/app/dashboard";
            console.log("✅ Condición AUTH cumplida");
            console.log("→ Redirigiendo desde auth a:", targetRoute);
            route.replace(targetRoute);
            return;
          }
          
          // Si es docente e intenta acceder al dashboard principal
          const esDashboardPrincipal = pathName.startsWith("/app/dashboard") && !pathName.startsWith("/app/dashboard-docente");
          console.log("¿Es dashboard principal?:", esDashboardPrincipal);
          console.log("¿Es docente?:", isDocente);
          
          if (isDocente && esDashboardPrincipal) {
            console.log("✅ REDIRIGIENDO DOCENTE DE DASHBOARD PRINCIPAL A DASHBOARD-DOCENTE");
            route.replace("/app/dashboard-docente");
            return;
          }
          
          // Si NO es docente e intenta acceder al dashboard de docentes
          if (!isDocente && pathName.startsWith("/app/dashboard-docente")) {
            console.log("✅ REDIRIGIENDO NO-DOCENTE DE DASHBOARD-DOCENTE A DASHBOARD PRINCIPAL");
            route.replace("/app/dashboard");
            return;
          }
          
          console.log("❌ Ninguna condición de redirección cumplida");
        }
      }
      //? SI EL USUARIO NO ESTÁ AUTENTICADO
      else {
        // Limpiar localStorage si Firebase dice que no hay usuario
        localStorage.removeItem("user");
        setUser(undefined);
        setIsLoading(false);
        
        const protectedRoutes = ["/app/dashboard", "/app/dashboard-docente"];
        const isProtectedRoute = protectedRoutes.some(route => pathName.startsWith(route));
        
        if (isProtectedRoute) {
          route.replace("/auth");
        }
      }
    });

    return () => unsubscribe();
  }, [pathName]);

  return { user, isLoading };
};
