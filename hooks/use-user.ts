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

  const protectedRoutes = "/app/dashboard";
  //   const isInprotectedRoute = protectedRoutes.includes(pathName);

  const getUserFromDB = async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const res = await getDocument(path);
      setUser(res);
      setInLocalstorage("user", res);
    } catch (error) {
      console.error("Error fetching user from database:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      //? SI EL USUARIO ESTÁ AUTENTICADO
      if (authUser) {
        const userInLocal = getFromLocalstorage("user");
        if (userInLocal) {
          setUser(userInLocal);
        } else {
          await getUserFromDB(authUser.uid);
        }
        setIsLoading(false);
      }
      //? SI EL USUARIO NO ESTÁ AUTENTICADO
      else {
        // Limpiar localStorage si Firebase dice que no hay usuario
        localStorage.removeItem("user");
        setUser(undefined);
        setIsLoading(false);
        
        if (pathName.startsWith(protectedRoutes)) {
          route.replace("/auth");
        }
      }
    });

    return () => unsubscribe();
  }, [pathName]);

  return { user, isLoading };
};
