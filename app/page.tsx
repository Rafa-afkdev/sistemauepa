"use client"
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { BookOpen, Users, Award, Heart, MapPin, Phone, Mail, Clock, Target, Eye, GraduationCap, Star } from 'lucide-react';
import Footer from './components/FooterLanding';
import Image from 'next/image';

const images = [
  '/28.webp',
  '/31.webp',
  '/32.webp',
  '/33.webp',
  '/34.webp',
  '/35.webp'
];

export default function AdventistSchool() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Cambiar imagen cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          {images.map((image, index) => (
            <motion.img
              key={image}
              src={image}
              alt="Estudiantes del colegio"
              className={`absolute inset-0 w-full h-full object-cover opacity-20 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-20' : 'opacity-0'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentImageIndex ? 0.2 : 0 }}
              transition={{ duration: 1 }}
            />
          ))}
          <div className="absolute inset-0 bg-black/60"  />
        </div>

        {/* Decorative Elements Removed */}

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-center py-12">
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-3xl flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-6 sm:mb-8"
              >
                <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-white/30">
                  <p className="text-white font-bold text-xs sm:text-sm tracking-wider">Educación con propósito</p>
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6"
              >
                U.E.P. Adventista
                <span className="block text-white drop-shadow-lg mt-2">Alejandro Oropeza Castillo</span>
              </motion.h1>
              
              <motion.p 
              
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0"
              >
                <span className="font-semibold text-white drop-shadow-md">Mano, mente y corazón</span> - Formando a nuestros estudiantes con valores cristianos en Guarenas, Estado Miranda
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
              >
                {/* <a 
                  href="#inscripciones"
                  className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-2xl hover:shadow-yellow-400/50 transform hover:-translate-y-1"
                >
                  <GraduationCap className="mr-2" size={24} />
                  Inscripciones Abiertas
                </a> */}
                <a 
                  href="#vision"
                  className="inline-flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 border-2 border-white/30"
                >
                  Conoce más
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-shrink-0 flex items-center justify-center mt-8 lg:mt-0"
            >
              <Image 
                src="/LOGO-COLEGIO.png" 
                alt="Logo U.E.P Adventista Alejandro Oropeza Castillo" 
                width={200} 
                height={200}
                priority
                className="object-contain w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 xl:w-[300px] xl:h-[300px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      {/* Vision & Mission Section */}
      <section id="vision" className="py-24 bg-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-50 blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-900 mb-4">
              Nuestra identidad
            </h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-600/10 rounded-2xl rotate-6" />
              <div className="relative bg-white rounded-2xl p-8 shadow-lg border-l-4 border-blue-600">
                <div className="flex items-start mb-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">Nuestra visión</h3>
                    <div className="w-16 h-1 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Ser una institución educativa que contribuya a la formación de hombres y mujeres competentes para enfrentar los retos y desafíos de esta sociedad, con entera confianza y fidelidad a los designios de Dios.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start group">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Star className="w-3 h-3 text-blue-600 group-hover:text-white" fill="currentColor" />
                    </div>
                    <span className="text-gray-600">Excelencia académica con sentido de propósito</span>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Star className="w-3 h-3 text-blue-600 group-hover:text-white" fill="currentColor" />
                    </div>
                    <span className="text-gray-600">Ciudadanía responsable y liderazgo de servicio</span>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Star className="w-3 h-3 text-blue-600 group-hover:text-white" fill="currentColor" />
                    </div>
                    <span className="text-gray-600">Esperanza y fe como motor de transformación</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-600/10 rounded-2xl -rotate-6" />
              <div className="relative bg-white rounded-2xl p-8 shadow-lg border-l-4 border-red-600">
                <div className="flex items-start mb-6">
                  <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-red-900 mb-2">Nuestra misión</h3>
                    <div className="w-16 h-1 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Ofrecer un ambiente educativo armonioso, donde se desarrollen las facultades físicas, mentales y espirituales de cada ser, y donde el estudiante sea partícipe activo de su formación, estableciendo lazos de solidaridad hacia sus semejantes y enalteciendo a Dios como Creador y Sustentador de todas las cosas.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start group">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover:bg-red-600 transition-colors">
                      <Heart className="w-3 h-3 text-red-600 group-hover:text-white" fill="currentColor" />
                    </div>
                    <span className="text-gray-600">Acompañamiento cercano a familias y estudiantes</span>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover:bg-red-600 transition-colors">
                      <Heart className="w-3 h-3 text-red-600 group-hover:text-white" fill="currentColor" />
                    </div>
                    <span className="text-gray-600">Ambiente seguro, respetuoso y colaborativo</span>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover:bg-red-600 transition-colors">
                      <Heart className="w-3 h-3 text-red-600 group-hover:text-white" fill="currentColor" />
                    </div>
                    <span className="text-gray-600">Formación espiritual intencional y vivencial</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Values Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/28.webp')",
            }}
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Nuestros pilares
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
              Educación integral que fortalece el cuerpo, la mente y el espíritu
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Value 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:bg-white/20 hover:shadow-2xl transition-all duration-300 border border-white/20 h-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                  <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">Excelencia académica</h3>
                <p className="text-white/90 leading-relaxed">
                  Programas educativos de calidad que preparan a nuestros estudiantes para los desafíos del futuro.
                </p>
              </div>
            </motion.div>

            {/* Value 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 hover:shadow-2xl transition-all duration-300 border border-white/20 h-full">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Valores cristianos</h3>
                <p className="text-white/90 leading-relaxed">
                  Formación espiritual sólida basada en principios bíblicos y el amor de Dios.
                </p>
              </div>
            </motion.div>

            {/* Value 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 hover:shadow-2xl transition-all duration-300 border border-white/20 h-full">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Comunidad unida</h3>
                <p className="text-white/90 leading-relaxed">
                  Un ambiente de fraternidad donde cada miembro es valorado y respetado.
                </p>
              </div>
            </motion.div>

            {/* Value 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 hover:shadow-2xl transition-all duration-300 border border-white/20 h-full">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Desarrollo integral</h3>
                <p className="text-white/90 leading-relaxed">
                  Cultivamos las habilidades físicas, mentales y espirituales de cada estudiante.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section with Background */}
      <section id="inscripciones" className="relative py-32 px-4 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/20.webp')",
          }}
        />
        <div className="absolute inset-0 bg-black/80" />

        {/* Decorative Elements Removed */}

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 drop-shadow-2xl px-4"
            >
              ¡Forma parte de nuestra educación adventista!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-black/40 border-2 border-yellow-400/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 mb-8 sm:mb-10 mx-4"
            >
              <p className="text-xl sm:text-2xl md:text-3xl text-white font-semibold mb-4 sm:mb-6">
                Formando personas competentes con valores cristianos
              </p>
              <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
                En nuestro colegio, cada estudiante es un participante activo de su formación. 
                Creemos en el desarrollo integral de habilidades que preparan para los desafíos de la vida, 
                siempre con la guía de Dios como nuestro Creador y Sustentador.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <a 
                href="tel:+582123456789"
                className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 rounded-full transition-all duration-300 shadow-2xl hover:shadow-yellow-400/50 transform hover:-translate-y-1 hover:scale-105"
              >
                <Phone className="mr-2 sm:mr-3" size={20} />
                Llámanos ahora
              </a>
              <a 
                href="mailto:info@colegioadventista.edu.ve"
                className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-blue-900 font-bold text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 rounded-full transition-all duration-300 shadow-2xl hover:shadow-white/50 transform hover:-translate-y-1 hover:scale-105"
              >
                <Mail className="mr-2 sm:mr-3" size={20} />
                Escríbenos
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center text-white/80 gap-2 px-4"
            >
              <div className="flex items-center">
                <Clock className="mr-2" size={18} />
                <span className="text-sm sm:text-base lg:text-lg text-center">Horario de atención:</span>
              </div>
              <span className="text-sm sm:text-base lg:text-lg text-center">Lunes a viernes, 7:00 AM - 3:00 PM</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer/>

      {/* Location Section */}
      {/* <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-blue-900 mb-4">
              Visítanos
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600">
              Estamos ubicados en Guarenas, Estado Miranda
            </p>    
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl p-10 max-w-3xl mx-auto"
          >
            <div className="flex items-start mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Nuestra Dirección</h3>
                <p className="text-xl text-gray-700">
                  Guarenas, Estado Miranda, Venezuela
                </p>
              </div>
            </div>
            
            <div className="border-t-2 border-gray-100 pt-6 mt-6">
              <p className="text-lg text-gray-600 mb-6">
                Te esperamos con las puertas abiertas para conocer nuestras instalaciones y resolver todas tus dudas sobre el proceso de inscripción.
              </p>
              <a 
                href="#inscripciones"
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Agenda tu Visita
              </a>
            </div>
          </motion.div>
        </div>
      </section> */}
    </main>
  )
}