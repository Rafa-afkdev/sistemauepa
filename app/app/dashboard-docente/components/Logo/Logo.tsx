"use client";
import React from "react";

import Image from "next/image";
  import { useRouter } from "next/navigation";

export function Logo() {
    const router = useRouter()
  return (
    <div className="min-h-28 flex items-center justify-center border-b cursor-pointer"
    onClick={() => router.push("/app/dashboard-docente")}>
        <div className="p-2">
          <Image 
            src="/LOGO-COLEGIO.png" 
            alt="Logo" 
            width={120} 
            height={60} 
            priority
            className="object-contain"
          />
        </div>
    </div>
  )
}
