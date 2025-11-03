'use client';

import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function Footer() {
  const [year, setYear] = React.useState(2025);

  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#213A64] text-white">
      {/* Barra decorativa superior */}
      <div className="h-1 bg-gradient-to-r from-[#FFC72C] via-[#D43336] to-[#FFC72C]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          
          {/* Información de Contacto */}
          <div>
            <h3 className="text-[#FFC72C] font-semibold text-lg mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Contáctanos
            </h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex items-start">
                <Mail className="w-4 h-4 mr-3 mt-0.5 text-[#FFC72C] flex-shrink-0" />
                <a 
                  href="mailto:uep.adventista.aoc@gmail.com" 
                  className="hover:text-[#FFC72C] transition-colors"
                >
                  uep.adventista.aoc@gmail.com
                </a>
              </div>
              <div className="flex items-start">
                <Phone className="w-4 h-4 mr-3 mt-0.5 text-[#FFC72C] flex-shrink-0" />
                <a 
                  href="tel:+584128860080" 
                  className="hover:text-[#FFC72C] transition-colors"
                >
                  0412-8860080
                </a>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-3 mt-0.5 text-[#FFC72C] flex-shrink-0" />
                <a 
                  href="https://maps.app.goo.gl/iR6TTghbusNcu62M6" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#FFC72C] transition-colors"
                >
                  Colegio Adventista Alejandro<br />
                  Oropeza Castillo
                </a>
              </div>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          {/* <div>
            <h3 className="text-[#FFC72C] font-semibold text-lg mb-4">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/" className="hover:text-[#FFC72C] transition-colors hover:underline">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-[#FFC72C] transition-colors hover:underline">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/servicos" className="hover:text-[#FFC72C] transition-colors hover:underline">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/voluntariado" className="hover:text-[#FFC72C] transition-colors hover:underline">
                  Voluntariado
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Redes Sociales y Lema */}
          <div className="flex flex-col md:items-end md:text-right md:col-start-3">
            <h3 className="text-[#FFC72C] font-semibold text-lg mb-4">
              Síguenos
            </h3>
            <div className="flex justify-end space-x-3 mb-6 w-full">
              <Link
                href="https://www.instagram.com/uepa.aoc/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D43336] hover:bg-[#FFC72C] text-white p-3 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.facebook.com/uepa.aoc/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D43336] hover:bg-[#FFC72C] text-white p-3 rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
            </div>
            <div className="border-l-4 pl-4 md:border-l-0 md:pl-0 md:border-r-4 md:pr-4 border-[#FFC72C] text-sm text-gray-300">
              <p className="italic mb-2">"Mano, Mente Y Corazón"</p>
              <p className="text-[#FFC72C] font-semibold">Guarenas, Edo. Miranda</p>
            </div>
          </div>
        </div>

        {/* Sección inferior */}
        <div className="pt-8 border-t border-white/20 text-center text-sm text-gray-300">
          <p className="mb-3">
            © {year} <span className="text-[#FFC72C] font-semibold">U.E.P ADVENTISTA ALEJANDO OROPEZA CASTILLO</span> - Todos los derechos reservados
          </p>
          <div className="flex justify-center space-x-6">
            <Link 
              href="/privacidade" 
              className="hover:text-[#FFC72C] transition-colors hover:underline"
            >
              Política de Privacidad
            </Link>
            <span className="text-[#D43336]">•</span>
            <Link 
              href="/termos" 
              className="hover:text-[#FFC72C] transition-colors hover:underline"
            >
              Términos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}