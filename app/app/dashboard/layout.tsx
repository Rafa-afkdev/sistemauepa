import React from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import { NavBar } from './components/NavBar/NavBar';


export default function LayoutDashboard({children} : {children: React.ReactNode}) {
  
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
