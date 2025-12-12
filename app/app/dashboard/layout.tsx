"use client";

import React from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import { NavBar } from './components/NavBar/NavBar';
import { useUser } from '@/hooks/use-user';

export default function LayoutDashboard({children} : {children: React.ReactNode}) {
  const { user, isLoading } = useUser();

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // No mostrar nada si es docente (el hook se encargará de redirigir)
  if (user && user.rol && user.rol.toLowerCase() === "docente") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }
  
  return (
    <div className='flex w-full h-full'>
        <div className='hidden xl:block w-80 h-full xl:fixed'>
            <Sidebar/>
        </div>
        <div className='w-full xl:ml-60'>
           <NavBar/>
            <div className='p-6 bg-[#ffffff] dark:bg-secondary'>
              {children}
            </div>
        </div>
    </div>
  )
}
