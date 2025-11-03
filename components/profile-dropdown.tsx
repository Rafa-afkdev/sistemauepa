/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  CircleUserRound,
  ImagePlus,
  LifeBuoy,
  LoaderCircle,
  LogOut,
  User,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { useEffect, useState } from "react";
import { fileToBase64 } from "@/actions/convert-file-to-base64";
import Image from "next/image";
import { setInLocalstorage } from "@/actions/set-in-LocalStorage";
import { showToast } from "nextjs-toast-notify";
import { signOutAccount, updateDocument } from "@/lib/data/firebase";

export function ProfileDropdown() {
  const user = useUser();
  const [image, setimage] = useState<string | null>(null);
  const [isLoading, setisLoading] = useState<boolean>(false);

  //! SELECCIONAR UNA IMAGEN DE PERFIL//
  // const chooseImage = async (event: any) => {
  //   const file = event.target.files[0];

  //   console.log(file);
  //   setisLoading(true);
  //   try {
  //     const base64 = await fileToBase64(file);
  //     const imagePath = `${user?.uid}/profile`;

  //     const imageUrl = await uploadBase64(imagePath, base64);
  //     await updateDocument(`users/${user?.uid}`, { image: imageUrl });

  //     setimage(imageUrl);

  //     if(user){
  //       user.image = imageUrl;
  //       setInLocalstorage('user', user);
  //     }

  //     toast.success("Imagen de perfíl actualizada");
  //   } catch (error: any) {
  //     toast.error(error.message, { duration: 2500 });
  //   } finally {
  //     setisLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if(user?.image) setimage(user.image);
  // }, [user])
  
  const chooseImage = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setisLoading(true);
    
    try {
        const base64 = await fileToBase64(file);
        
        // Validación adicional
        if (!base64 || !file.type) {
            throw new Error("Datos de imagen corruptos");
        }

        const imageData = {
            base64: base64,
            contentType: file.type,
            timestamp: new Date().toISOString()
        };

        await updateDocument(`users/${user?.uid}`, { 
            image: imageData
        });

        // Actualización local segura
        setimage(`data:${file.type};base64,${base64}`);
        
        if (user) {
            user.image = imageData;
            setInLocalstorage('user', user);
        }

        showToast.success("Imagen de perfil actualizada");
    } catch (error: any) {
        showToast.error(error.message || "Error al procesar imagen");
    } finally {
        setisLoading(false);
    }
};

useEffect(() => {
  if (user?.image?.base64 && user?.image?.contentType) {
      const dataUrl = `data:${user.image.contentType};base64,${user.image.base64}`;
      setimage(dataUrl);
  } else {
      setimage(null);
      // Limpia datos corruptos si es necesario
      if (user?.image) {
          updateDocument(`users/${user.uid}`, { image: null });
      }
  }
}, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <span className="mr-2">Mi Cuenta</span>
          {image ? (
                <Image className="object-cover w-6 h-6 rounded-full m-auto" src={image} width={1000} height={1000} alt="user-img" />
              ) : (
                <CircleUserRound className="m-auto w-6 h-6" />
              )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="text-center">
          {isLoading ? (
            <LoaderCircle className="w-14 h-14 animate-spin m-auto mb-3" />
          ) : (
            <>
              {image ? (
                <Image className="object-cover w-20 h-20 rounded-full m-auto" src={image} width={1000} height={1000} alt="user-img" />
              ) : (
                <CircleUserRound className="m-auto w-20 h-20" />
              )}

              <div className="flex justify-center relative bottom-2">
                <div>
                  <input
                    id="files"
                    className="hidden"
                    accept="image/png, image/webp, image/jpeg"
                    type="file"
                    onChange={(event) => chooseImage(event)}
                  />
                  <label htmlFor="files">
                    <div className="w-[40px] h-[28] cursor-pointer rounded-lg text-white bg-slate-950 hover:bg-slate-800 flex justify-center items-center">
                      <ImagePlus className="w-[18px] h-[18px]" />
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          <div>{user?.name} {user?.apellidos}</div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            <span>Perfíl</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuItem>
          <LifeBuoy />
          <span>Soporte</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAccount()}>
          <LogOut />
          <span>Cerrar Sesión</span>
          {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
