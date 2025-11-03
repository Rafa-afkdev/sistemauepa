"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SignInForm from "./components/sign-in.form";

export default function AuthPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Botón de volver */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>
      {/* Fondo con imagen */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/30.webp"
          alt="Background"
          fill
          className="object-cover -z-10"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      </div>
      {/* Contenedor principal */}
      <div className="relative z-10 flex flex-col items-center justify-between w-full max-w-screen-lg p-4 space-y-8 md:p-8 md:flex-row md:space-y-0">
        {/* Logo con animación */}
        <div
          className={`flex items-center justify-center transition-all duration-700 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
        >
          <Image
            src="/LOGO-COLEGIO.png"
            alt="Logo"
            width={300}
            height={150}
            className="object-cover"
            priority
          />
        </div>

        {/* Formulario de inicio de sesión */}
        <div
          className={`w-full max-w-xs transition-all duration-700 ${
            isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
        >
          <SignInForm />
        </div>
      </div>
      
      {/* Onda decorativa en la parte inferior */}
      {/* <div 
        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path 
            fill="#002F76FF" 
            fillOpacity="1" 
            d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div> */}
    </div>
  );
}
