'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/about', label: 'Nosotros' },
  { href: '/personal', label: 'Personal' },
  { href: '/actividades', label: 'Actividades' },
  { href: '/contactanos', label: 'Contáctanos' },
];

export default function  Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`w-full absolute top-0 left-0 z-50 transition-all duration-300 ${
        isOpen
          ? 'bg-blue-950/95 backdrop-blur-md border-b border-white/10 shadow-2xl'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-24 justify-end">

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <motion.div
                key={link.href}
                whileHover={{ y: -2 }}
                className="group flex flex-col items-center"
              >
                <Link
                  href={link.href}
                  className={`font-ui text-base transition-all duration-300 tracking-wide ${
                    isActive(link.href)
                      ? 'text-yellow-400'
                      : 'text-white hover:text-yellow-400'
                  }`}
                >
                  {link.label}
                </Link>
                <span
                  className={`mt-1 h-0.5 w-full max-w-[28px] bg-yellow-400 rounded origin-left transform transition-transform duration-300 ${
                    isActive(link.href) ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                  }`}
                />
              </motion.div>
            ))}
            <motion.div
              whileHover={{ y: -2 }}
              className="group flex flex-col items-center"
            >
              <Link
                href="/auth"
                className="flex items-center gap-2 bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300 shadow-lg hover:shadow-yellow-400/30"
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              {isOpen ? (
                <X className="w-7 h-7 text-white" />
              ) : (
                <Menu className="w-7 h-7 text-white" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="md:hidden overflow-hidden"
      >
        <div className="px-4 pt-2 pb-6 border-t border-white/10 space-y-1">
          {navLinks.map((link) => (
            <motion.div
              key={link.href}
              whileHover={{ x: 4 }}
            >
              <Link
                href={link.href}
                className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-yellow-400 bg-white/5'
                    : 'text-white/80 hover:text-yellow-400 hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <div className="pt-2">
            <Link
              href="/auth"
              className="flex items-center gap-2 bg-yellow-400 text-blue-900 px-4 py-3 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300 mx-3 text-center justify-center shadow-lg hover:shadow-yellow-400/20"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}