import React from 'react';
import { Menu } from 'lucide-react';
import { SidebarRoutes } from '../SidebarRoutes/SidebarRoutes';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProfileDropdown } from '@/components/profile-dropdown';

export function NavBar() {
  return (
    <div className='flex items-center px-2 gap-x-4 md:px-6 justify-between w-full bg-background h-20'>

      <div className='block xl:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <button className='flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'>
              <Menu className='w-5 h-5' />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SidebarRoutes />
          </SheetContent>
        </Sheet>
      </div>

      <div className='relative w-[300px]'>
        {/* <Input placeholder='Buscar...' className='rounded-lg pl-10' /> 
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <Search className='h-5 w-5 text-gray-600' /> 
        </div> */}
      </div>

      <div className='flex gap-x-2 items-center'>
        <ProfileDropdown />
      </div>
    </div>
  );
}