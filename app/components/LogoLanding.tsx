"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function LogoLanding() {
  const router = useRouter();

  return (
    <div 
      className="min-h-10 flex items-center justify-center px-1 cursor-pointer gap-2"
      onClick={() => router.push("/")}
    >
      <Image 
        src="/LOGO-COLEGIO.png" 
        alt="Logo" 
        width={100} 
        height={50} 
      />
    </div>
  )
}