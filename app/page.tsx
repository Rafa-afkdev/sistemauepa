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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex items-center">
          <div className="w-full flex items-center justify-between gap-8">
            <div className="max-w-3xl flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/30">
                  <p className="text-white font-bold text-sm tracking-wider">EDUCACIÓN CON PROPÓSITO</p>
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
              >
                U.E.P. Adventista
                <span className="block text-white drop-shadow-lg">Alejandro Oropeza Castillo</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed"
              >
                <span className="font-semibold text-white drop-shadow-md">Mano, Mente y Corazón</span> - Formando a nuestros estudiantes con valores cristianos en Guarenas, Estado Miranda
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
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
                  className="inline-flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 border-2 border-white/30"
                >
                  Conoce Más
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex-shrink-0 hidden lg:flex items-center justify-center"
            >
              <Image 
                src="/LOGO-COLEGIO.png" 
                alt="Logo U.E.P Adventista Alejandro Oropeza Castillo" 
                width={300} 
                height={300}
                priority
                className="object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section id="vision" className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-blue-900 mb-4">
              Nuestra Identidad
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl transform group-hover:scale-105 transition-transform duration-300 shadow-2xl" />
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mr-4">
                    <Eye className="w-8 h-8 text-blue-900" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Nuestra Visión</h3>
                </div>
                <p className="text-white/95 text-lg leading-relaxed">
                  Ser una institución educativa que contribuya a la formación de hombres y mujeres competentes para enfrentar los retos y desafíos de esta sociedad, con entera confianza y fidelidad a los designios de Dios.
                </p>
                <div className="mt-6 flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" />
                  <Star className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" />
                  <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                </div>
              </div>
            </motion.div>

            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl transform group-hover:scale-105 transition-transform duration-300 shadow-2xl" />
              <div className="relative bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-10 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mr-4">
                    <Target className="w-8 h-8 text-red-900" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Nuestra Misión</h3>
                </div>
                <p className="text-white/95 text-lg leading-relaxed">
                  Ofrecer un ambiente educativo armonioso, donde se desarrollen las facultades físicas, mentales y espirituales de cada ser, y donde el estudiante sea partícipe activo de su formación, estableciendo lazos de solidaridad hacia sus semejantes y enalteciendo a Dios como Creador y Sustentador de todas las cosas.
                </p>
                <div className="mt-6 flex items-center">
                  <Heart className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" />
                  <Heart className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" />
                  <Heart className="w-5 h-5 text-yellow-400" fill="currentColor" />
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
            <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Nuestros Pilares
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
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
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 hover:shadow-2xl transition-all duration-300 border border-white/20 h-full">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Excelencia Académica</h3>
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
                <h3 className="text-2xl font-bold text-white mb-4">Valores Cristianos</h3>
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
                <h3 className="text-2xl font-bold text-white mb-4">Comunidad Unida</h3>
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
                <h3 className="text-2xl font-bold text-white mb-4">Desarrollo Integral</h3>
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
              className="text-5xl md:text-6xl font-bold text-white mb-8 drop-shadow-2xl"
            >
              ¡Forma Parte De Nuestra Educación Adventista!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-black/40 border-2 border-yellow-400/30 rounded-3xl p-10 md:p-14 mb-10"
            >
              <p className="text-2xl md:text-3xl text-white font-semibold mb-6">
                Formando personas competentes con valores cristianos
              </p>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
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
                className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-xl px-10 py-6 rounded-full transition-all duration-300 shadow-2xl hover:shadow-yellow-400/50 transform hover:-translate-y-1 hover:scale-105"
              >
                <Phone className="mr-3" size={28} />
                Llámanos Ahora
              </a>
              <a 
                href="mailto:info@colegioadventista.edu.ve"
                className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-blue-900 font-bold text-xl px-10 py-6 rounded-full transition-all duration-300 shadow-2xl hover:shadow-white/50 transform hover:-translate-y-1 hover:scale-105"
              >
                <Mail className="mr-3" size={28} />
                Escríbenos
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 flex items-center justify-center text-white/80"
            >
              <Clock className="mr-2" size={20} />
              <span className="text-lg">Horario de atención: Lunes a Viernes, 7:00 AM - 3:00 PM</span>
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