"use client"
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Users, Award, BookOpen, Wrench, ShieldCheck, GraduationCap } from 'lucide-react';
import Footer from '@/app/components/FooterLanding';

export default function PersonalComponent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const personal = {
    directivos: [
      {
        name: "Rony Brazón",
        position: "Director",
        image: "/personal/Rony-Brazón.-Director.webp",
        category: "directivos"
      },
      {
        name: "Reinaldo Medina",
        position: "Sub-Director Académico",
        image: "/personal/Reinaldo-Medina.-Sub-Director-Académico.webp",
        category: "directivos"
      },
      {
        name: "Ana Caldea",
        position: "Coordinadora de Primaria y Control de Estudios",
        image: "/personal/Prof.-Ana-Caldea_-Coordinadora-de-Primaria-y-Coordinadora-de-Control-de-Estudios-y-Evaluación.webp",
        category: "directivos"
      }
    ],
    docentes: [
      {
        name: "Karelia Rivas",
        position: "Maestra de 1er Grado",
        image: "/personal/Karelia-Rivas-Maestra-de-1er-grado.webp",
        category: "docentes"
      },
      {
        name: "Tania Bárcenas",
        position: "Maestra de 3er Grado",
        image: "/personal/Tania-Barcenas-Maestra-de-3er-grado.webp",
        category: "docentes"
      },
      {
        name: "Matilde Navas",
        position: "Maestra de 4to Grado",
        image: "/personal/Matilde-Navas.-Maestra-de-4to-grado.webp",
        category: "docentes"
      },
      {
        name: "Yudeima López",
        position: "Maestra de 5to Grado",
        image: "/personal/Yudeima-Lopez-Maestra-de-5to-grado.webp",
        category: "docentes"
      },
      {
        name: "Esther Castro",
        position: "Profesora de Inglés",
        image: "/personal/Esther-Castro.-Prof.-De-Inglés.webp",
        category: "docentes"
      },
      {
        name: "Evelyn Guzmán",
        position: "Profesora de Castellano",
        image: "/personal/Evelyn-Guzmán.-Prof.-De-Castellano.webp",
        category: "docentes"
      },
      {
        name: "María Cortéz",
        position: "Profesora de Biología, Ciencias de la Tierra y Ciencias Naturales",
        image: "/personal/María-Cortéz.-Prof.-De-Biología_-Ciencias-de-la-tierra-y-Ciencias-Naturales.webp",
        category: "docentes"
      },
      {
        name: "Maury Pérez",
        position: "Profesora de Química",
        image: "/personal/Maury-Pérez.-Prof.-De-Química.webp",
        category: "docentes"
      },
      {
        name: "Ana Duarte",
        position: "Profesora de Computación",
        image: "/personal/Ana-Duarte.-Prof.-De-Computación.webp",
        category: "docentes"
      }
    ],
    apoyo: [
      {
        name: "Sureli Oliveros",
        position: "Auxiliar de 1er Grado",
        image: "/personal/Sureli-Oliveros-Auxiliar-de-1er-grado.webp",
        category: "apoyo"
      },
      {
        name: "Gloria Vargas",
        position: "Secretaría de Control de Estudios",
        image: "/personal/Gloria-Vargas.-Secretaría-de-Control-de-Estudios.webp",
        category: "apoyo"
      },
      {
        name: "Johnson Piñango",
        position: "Bibliotecario",
        image: "/personal/Johnson-Piñango-Bibliotecario.webp",
        category: "apoyo"
      },
      {
        name: "Juana García",
        position: "Portera",
        image: "/personal/Juana-García.-Portera.webp",
        category: "apoyo"
      },
      {
        name: "Ducleidy Monges",
        position: "Personal de Mantenimiento",
        image: "/personal/Ducleidy-Monges.-Personal-de-Mantenimiento.webp",
        category: "apoyo"
      },
      {
        name: "Ramón Rivas",
        position: "Personal de Mantenimiento",
        image: "/personal/Ramón-Rivas.-Personal-de-Mantenimiento.webp",
        category: "apoyo"
      }
    ]
  };

  const allPersonal = [...personal.directivos, ...personal.docentes, ...personal.apoyo];
  const filteredPersonal = selectedCategory === "all" 
    ? allPersonal 
    : selectedCategory === "directivos" 
      ? personal.directivos
      : selectedCategory === "docentes"
        ? personal.docentes
        : personal.apoyo;

  const categories = [
    { id: "all", label: "Todo el Personal", icon: <Users className="w-5 h-5" /> },
    { id: "directivos", label: "Directivos", icon: <Award className="w-5 h-5" /> },
    { id: "docentes", label: "Docentes", icon: <GraduationCap className="w-5 h-5" /> },
    { id: "apoyo", label: "Personal de Apoyo", icon: <ShieldCheck className="w-5 h-5" /> }
  ];

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/28.webp"
            alt="Colegio background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-blue-800/20 to-blue-600/20" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-center pt-24">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-yellow-400/30">
                <p className="text-yellow-400 font-bold text-sm tracking-wider">NUESTRO EQUIPO</p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Personal Docente y Administrativo
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/90 leading-relaxed"
            >
              Conoce al equipo comprometido que hace posible nuestra misión educativa con excelencia y valores cristianos.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-12 bg-gray-50 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-200"
                }`}
              >
                {category.icon}
                {category.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filteredPersonal.map((person, index) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group "
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-80 overflow-hidden ">
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {person.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {person.position}
                    </p>
                    
                    {/* Category Badge */}
                    <div className="mt-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        person.category === "directivos" 
                          ? "bg-blue-100 text-blue-700"
                          : person.category === "docentes"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                      }`}>
                        {person.category === "directivos" ? "Directivo" : person.category === "docentes" ? "Docente" : "Apoyo"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredPersonal.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No se encontró personal en esta categoría</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-blue-900" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">{personal.directivos.length}</h3>
              <p className="text-xl text-white/90">Directivos</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-blue-900" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">{personal.docentes.length}</h3>
              <p className="text-xl text-white/90">Docentes</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-10 h-10 text-blue-900" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">{personal.apoyo.length}</h3>
              <p className="text-xl text-white/90">Personal de Apoyo</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
