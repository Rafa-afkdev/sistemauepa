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
    return onAuthStateChanged(auth, async (authUser) => {
      //? SI EL USUARIO ESTÁ AUTENTICADO
      if (authUser) {
        const userInLocal = getFromLocalstorage("user");
        if (userInLocal) {
          setUser(userInLocal);
        } else {
          await getUserFromDB(authUser.uid);
        }
      }
      //? SI EL USUARIO NO ESTÁ AUTENTICADO
      else {
        if (pathName.startsWith(protectedRoutes)) {
          route.push("/auth");
        }
      }
    });
  }, []);

  return user;
};
