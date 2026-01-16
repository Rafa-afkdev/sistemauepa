"use client"
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Trophy, FlaskConical, Cross, Heart, Users, Cpu, BookHeart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Footer from '@/app/components/FooterLanding';

export default function ActivadesComponents() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const actividades = [
    {
      id: "voleibol",
      title: "Equipo de Voleibol",
      description: "Nuestro equipo deportivo de voleibol participa activamente en competencias interescolares, desarrollando valores como el trabajo en equipo, la disciplina y la perseverancia.",
      category: "Deportes",
      icon: <Trophy className="w-8 h-8" />,
      images: ["/1.webp", "/2.webp", "/3.webp"],
      color: "from-blue-600 to-blue-800"
    },
    {
      id: "quimica",
      title: "Experimentos de Química",
      description: "En nuestro laboratorio, los estudiantes exploran el mundo científico a través de experimentos prácticos, desarrollando el pensamiento crítico y la curiosidad por descubrir las maravillas de la creación de Dios.",
      category: "Académico",
      icon: <FlaskConical className="w-8 h-8" />,
      images: ["/9.webp", "/11.webp"],
      color: "from-purple-600 to-purple-800"
    },
    {
      id: "testificacion",
      title: "Caminata de Testificación",
      description: "Salimos a la comunidad para compartir el amor de Cristo y servir a nuestro prójimo, poniendo en práctica nuestra fe y valores cristianos mediante el servicio comunitario.",
      category: "Espiritual",
      icon: <Cross className="w-8 h-8" />,
      images: ["/4.webp", "/5.webp", "/6.webp"],
      color: "from-red-600 to-red-800"
    },
    {
      id: "deportivo",
      title: "Día Deportivo",
      description: "Una jornada especial donde celebramos la actividad física y el compañerismo, promoviendo la salud integral y el espíritu deportivo entre todos los estudiantes.",
      category: "Deportes",
      icon: <Trophy className="w-8 h-8" />,
      images: ["/19.webp", "/24.webp", "/22.webp"],
      color: "from-green-600 to-green-800"
    },
    {
      id: "escuadrones",
      title: "Encuentro de Escuadrones",
      description: "Reunión de grupos juveniles adventistas donde compartimos experiencias, fortalecemos la fe y creamos lazos de amistad con jóvenes de otras instituciones.",
      category: "Espiritual",
      icon: <Users className="w-8 h-8" />,
      images: ["/escuadron1.webp", "/escuadron2.webp", "/escuadron3.webp"],
      color: "from-yellow-600 to-yellow-800"
    },
    {
      id: "robotica",
      title: "Robótica",
      description: "Programa de tecnología y robótica donde los estudiantes desarrollan habilidades en programación, diseño y trabajo en equipo, preparándose para los desafíos del futuro.",
      category: "Tecnología",
      icon: <Cpu className="w-8 h-8" />,
      images: ["/robotica.webp"],
      color: "from-indigo-600 to-indigo-800"
    },
    {
      id: "oracion",
      title: "Semana de Oración",
      description: "Tiempo especial dedicado a fortalecer nuestra relación con Dios a través de la oración, el estudio bíblico y la reflexión espiritual, buscando Su guía en nuestras vidas.",
      category: "Espiritual",
      icon: <BookHeart className="w-8 h-8" />,
      images: ["/semanadeoracion.webp"],
      color: "from-pink-600 to-pink-800"
    }
  ];

  const openLightbox = (activityId: string, imageIndex: number) => {
    setSelectedActivity(activityId);
    setSelectedImageIndex(imageIndex);
  };

  const closeLightbox = () => {
    setSelectedActivity(null);
    setSelectedImageIndex(0);
  };

  const nextImage = () => {
    const activity = actividades.find(a => a.id === selectedActivity);
    if (activity) {
      setSelectedImageIndex((prev) => (prev + 1) % activity.images.length);
    }
  };

  const prevImage = () => {
    const activity = actividades.find(a => a.id === selectedActivity);
    if (activity) {
      setSelectedImageIndex((prev) => (prev - 1 + activity.images.length) % activity.images.length);
    }
  };

  const currentActivity = actividades.find(a => a.id === selectedActivity);

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-yellow-800 via-yellow-900 to-yellow-600">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/20.webp"
            alt="Actividades background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-800/40 via-yellow-900/40 to-yellow-600/40" />
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
                <p className="text-yellow-400 font-bold text-sm tracking-wider">NUESTRAS ACTIVIDADES</p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Formando Integralmente
              <span className="block text-yellow-400">Mano, Mente y Corazón</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/90 leading-relaxed"
            >
              Descubre las actividades que enriquecen la experiencia educativa de nuestros estudiantes, combinando excelencia académica, desarrollo físico y crecimiento espiritual.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-blue-900 mb-4">
              Nuestras Actividades
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experiencias que fortalecen el cuerpo, desarrollan la mente y nutren el espíritu
            </p>
            <div className="w-24 h-1 bg-linear-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full mt-6"></div>
          </motion.div>

          <div className="space-y-16">
            {actividades.map((actividad, index) => (
              <motion.div
                key={actividad.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}
              >
                <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 lg:flex ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}>
                  {/* Images Section */}
                  <div className="lg:w-1/2 p-8">
                    <div className="grid gap-4" style={{ 
                      gridTemplateColumns: actividad.images.length === 1 ? '1fr' : 
                                          actividad.images.length === 2 ? 'repeat(2, 1fr)' : 
                                          'repeat(2, 1fr)',
                      gridTemplateRows: actividad.images.length <= 2 ? '1fr' : 'repeat(2, 1fr)'
                    }}>
                      {actividad.images.map((image, imgIndex) => (
                        <motion.div
                          key={imgIndex}
                          whileHover={{ scale: 1.05 }}
                          className={`relative overflow-hidden rounded-2xl cursor-pointer group ${
                            actividad.images.length === 3 && imgIndex === 0 ? 'col-span-2' : ''
                          } ${actividad.images.length === 1 ? 'h-96' : 'h-64'}`}
                          onClick={() => openLightbox(actividad.id, imgIndex)}
                        >
                          <img
                            src={image}
                            alt={`${actividad.title} ${imgIndex + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <p className="text-white font-bold text-lg">Ver más</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <div className={`inline-block mb-4 bg-gradient-to-r ${actividad.color} text-white px-4 py-2 rounded-full text-sm font-semibold w-fit`}>
                      {actividad.category}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${actividad.color} rounded-2xl flex items-center justify-center text-white`}>
                        {actividad.icon}
                      </div>
                      <h3 className="text-3xl font-bold text-blue-900">{actividad.title}</h3>
                    </div>

                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      {actividad.description}
                    </p>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart className="w-5 h-5 text-red-600" fill="currentColor" />
                      <span className="text-sm font-semibold">{actividad.images.length} {actividad.images.length === 1 ? 'foto' : 'fotos'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedActivity && currentActivity && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-yellow-400 transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>

          {currentActivity.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 text-white hover:text-yellow-400 transition-colors z-50"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 text-white hover:text-yellow-400 transition-colors z-50"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </>
          )}

          <div className="max-w-6xl w-full">
            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={currentActivity.images[selectedImageIndex]}
              alt={currentActivity.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4">
              <h3 className="text-white text-2xl font-bold mb-2">{currentActivity.title}</h3>
              <p className="text-white/80">
                {selectedImageIndex + 1} / {currentActivity.images.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Quieres ser parte de nuestra institución?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Únete a nosotros y experimenta una educación integral que fortalece el cuerpo, desarrolla la mente y nutre el espíritu.
            </p>
            <a
              href="/contactanos"
              className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 shadow-2xl hover:shadow-yellow-400/50 transform hover:-translate-y-1"
            >
              Contáctanos
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
