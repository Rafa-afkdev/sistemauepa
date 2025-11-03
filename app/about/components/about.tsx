"use client"
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { BookOpen, Users, Award, Heart, Clock, Star, Calendar, Building2, TrendingUp } from 'lucide-react';
import Footer from '@/app/components/FooterLanding';

const images = [
  '/31.webp',
  '/32.webp',
  '/33.webp',
  '/34.webp',
  '/35.webp'
];

export default function About() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[60vh]">
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
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60vh] flex items-center">
          <div className="max-w-4xl text-center mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Sobre Nosotros
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-white/90 mb-8"
            >
              Conoce nuestra historia, misión y valores que nos definen como institución
            </motion.p>
          </div>
        </div>
      </section>

      {/* Historia Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-blue-900 mb-4">
              Nuestra Historia
            </h2>
            <div className="w-24 h-1 bg-linear-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full"></div>
          </motion.div>

          {/* Fundación */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-10 shadow-xl border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-blue-900">Los Inicios (1982-1983)</h3>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  La Unidad Educativa Adventista <strong>"Alejandro Oropeza Castillo"</strong> inicia sus actividades con el nombre de Escuela Adventista "Alejandro Oropeza Castillo" cuyos fundadores se constituyeron en miembros de la Sociedad de Padres y Representantes, según acta del <strong>30 de Octubre de 1982</strong>.
                </p>
                <p>
                  El día <strong>30 de mayo de 1983</strong>, queda registrada la institución ante la Notaría Pública del Distrito Plaza del Estado Miranda bajo el nombre de Escuela Adventista "Alejandro Oropeza Castillo" para el año escolar 1982 – 1983.
                </p>
                <p>
                  El nombre del epónimo se escogió a la memoria de quien en vida fue <strong>Alejandro Oropeza Castillo</strong>, un líder sindical y un político muy renombrado. Esta mención se le da también a la urbanización donde está localizada la institución.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filosofía */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-red-50 to-white rounded-3xl p-10 shadow-xl border border-red-100">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mr-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-red-900">Nuestra Filosofía</h3>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  La Escuela Adventista surge de un grupo de creyentes fieles a la filosofía de la iglesia adventista y a la educación adventista. Es decir, educar a los hijos considerando a <strong>Dios como fuente de todo sustento</strong> y de inculcar los principios de servicios a todos los educandos.
                </p>
                <p>
                  La intención primaria fue atender a todos los hijos de familia adventista extensiva hacia los pueblos de <strong>Guarenas y Guatire</strong>. Pero, al pasar los años muchos de los miembros de la comunidad desearon que sus hijos pudieran tener el privilegio de tener cupo en esta escuela para obtener los beneficios de una educación cristiana.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Infraestructura */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-3xl p-10 shadow-xl border border-yellow-100">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-yellow-900">Construcción e Infraestructura</h3>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  La construcción fue producto de la donación de la <strong>Fundación de Edificaciones Escolares (FEDE)</strong>. La edificación fue hecha con capacidad para <strong>siete aulas y dos baños</strong>. Se inició atendiendo los niveles de Pre-escolar y primera etapa de Educación Básica.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline de Directores */}
     

      {/* Logros Recientes */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-blue-900 mb-4">
              Logros y Mejoras Recientes
            </h2>
            <div className="w-24 h-1 bg-linear-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
                title: "Modernización Tecnológica",
                description: "Adquisición de equipos de computación y mejora de la infraestructura tecnológica para el aprendizaje del siglo XXI."
              },
              {
                icon: <Building2 className="w-8 h-8 text-red-600" />,
                title: "Expansión de Instalaciones",
                description: "Construcción de nuevos ambientes: salón de Preescolar, laboratorios, oficinas administrativas y mejora de baños."
              },
              {
                icon: <Award className="w-8 h-8 text-yellow-600" />,
                title: "Ciclo Diversificado",
                description: "Apertura del ciclo diversificado, ampliando las oportunidades educativas para nuestros estudiantes."
              },
              {
                icon: <Clock className="w-8 h-8 text-green-600" />,
                title: "Confort Climático",
                description: "Instalación de sistemas de aire acondicionado en aulas, biblioteca y oficinas para un ambiente óptimo de aprendizaje."
              },
              {
                icon: <Heart className="w-8 h-8 text-purple-600" />,
                title: "Servicios Básicos",
                description: "Habilitación de tanques de agua y sistema de filtrado industrial para garantizar agua potable de calidad."
              },
              {
                icon: <Star className="w-8 h-8 text-orange-600" />,
                title: "Seguridad Mejorada",
                description: "Instalación de cerco eléctrico en colaboración con la Congregación Adventista para proteger las instalaciones (2016)."
              }
            ].map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-blue-600 hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  {achievement.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{achievement.title}</h3>
                <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Mensaje Final */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl p-12 text-center shadow-2xl"
          >
            <p className="text-2xl md:text-3xl font-bold text-white mb-4">
              "Hasta aquí nos ha ayudado Dios"
            </p>
            <p className="text-xl text-white/90 leading-relaxed max-w-4xl mx-auto">
              No tenemos nada que temer al futuro, a menos que olvidemos como el Señor nos ha conducido hasta hoy. 
              <strong className="block mt-4 text-yellow-400">Gloria y honra a Jehová de los Ejércitos por siempre.</strong>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Valores Section */}
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
              Declaración de Valores
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
              La Unidad Educativa Adventista “Alejandro Oropeza Castillo” declara la práctica y creencia de los siguientes valores.
            </p>
            <div className="w-24 h-1 bg-linear-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full mb-12"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart className="w-8 h-8 text-red-600" />,
                title: "Amor a Dios y al Prójimo",
                description: "Amar a Dios por sobre todas las cosas y al prójimo como a sí mismo."
              },
              {
                icon: <Award className="w-8 h-8 text-blue-700" />,
                title: "Fidelidad a Dios",
                description: "Fidelidad a Dios y a Sus principios en nuestra vida diaria."
              },
              {
                icon: <Users className="w-8 h-8 text-purple-700" />,
                title: "Servicio",
                description: "Espíritu de servicio y ayuda al prójimo en toda circunstancia."
              },
              {
                icon: <Star className="w-8 h-8 text-yellow-600" />,
                title: "Honestidad",
                description: "Actuar con verdad, rectitud y transparencia."
              },
              {
                icon: <Clock className="w-8 h-8 text-blue-600" />,
                title: "Responsabilidad",
                description: "Cumplir los deberes con compromiso y puntualidad."
              },
              {
                icon: <Heart className="w-8 h-8 text-pink-600" />,
                title: "Gratitud",
                description: "Reconocer con agradecimiento las bendiciones recibidas."
              },
              {
                icon: <BookOpen className="w-8 h-8 text-emerald-700" />,
                title: "Excelencia Académica",
                description: "Buscar el máximo desarrollo de las capacidades para la gloria de Dios."
              },
              {
                icon: <Calendar className="w-8 h-8 text-indigo-700" />,
                title: "Orden",
                description: "Mantener organización y buen uso del tiempo y los recursos."
              },
              {
                icon: <Award className="w-8 h-8 text-green-700" />,
                title: "Disciplina",
                description: "Autocontrol y constancia para alcanzar metas con buen carácter."
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
