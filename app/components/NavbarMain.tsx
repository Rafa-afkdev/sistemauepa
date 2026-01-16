'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { LogoLanding } from './LogoLanding';

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
      className="w-full bg-transparent border-b border-transparent absolute top-0 left-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-24 justify-end md:justify-between">
          {/* Logo */}
          <Link href="/" className="hidden md:flex items-center"> 
            <motion.span 
              whileHover={{ scale: 1.02 }}
              className="text-3xl font-heading font-normal text-black tracking-wide"
            >
              <LogoLanding />
            </motion.span>
          </Link>

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
              className="p-2 rounded-full hover:bg-primary-gold/10 transition-all duration-300"
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20 }}
        transition={{ duration: 0.3 }}
        className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
      >
        <div className="px-4 pt-2 pb-6 bg-transparent border-t border-transparent">
          {navLinks.map((link) => (
            <motion.div
              key={link.href}
              whileHover={{ x: 4 }}
            >
              <Link
                href={link.href}
                className={`block px-3 py-2 text-base font-medium ${
                  isActive(link.href)
                    ? 'text-yellow-400'
                    : 'text-white hover:text-yellow-400'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <Link
            href="/auth"
            className="flex items-center gap-2 bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300 mt-4 mx-3 text-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </Link>
        </div>
      </motion.div>
    </motion.nav>
  );
}