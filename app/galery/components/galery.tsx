"use client";
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const images = [
  '/28.webp',
  '/31.webp',
  '/32.webp',
  '/33.webp',
  '/34.webp',
  '/35.webp'
];

const galleryImages = [
  { id: 1, src: '/28.webp', category: 'Actividades' },
  { id: 2, src: '/31.webp', category: 'Eventos' },
  { id: 3, src: '/32.webp', category: 'Instalaciones' },
  { id: 4, src: '/33.webp', category: 'Actividades' },
  { id: 5, src: '/34.webp', category: 'Eventos' },
  { id: 6, src: '/35.webp', category: 'Instalaciones' },
];

const categories = ['Todas', 'Actividades', 'Eventos', 'Instalaciones'];

export default function Gallery() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigationPrevRef = useRef<HTMLButtonElement>(null);
  const navigationNextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredImages = activeCategory === 'Todas' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  const openLightbox = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

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
          <div className="absolute inset-0 bg-black/60"  />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60vh] flex items-center">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-yellow-400/30">
                <p className="text-yellow-400 font-bold text-sm tracking-wider">EXPLORA NUESTRA</p>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Galería Multimedia
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/90 mb-8 max-w-2xl"
            >
              Descubre los momentos más especiales de nuestra comunidad educativa
            </motion.p>
          </div>
        </div>
      </section>

      {/* Gallery Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 text-sm ${
                activeCategory === category
                  ? 'bg-yellow-400 text-blue-900 font-semibold shadow-lg hover:shadow-yellow-400/50'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Main Gallery Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10"
              onClick={() => openLightbox(image.src)}
            >
              <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                <img
                  src={image.src}
                  alt={`Galería ${image.id}`}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-yellow-400 text-blue-900 text-xs font-semibold rounded-full mb-2">
                    {image.category}
                  </span>
                  <div className="flex items-center text-white/90">
                    <Maximize className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Ver más grande</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Slider */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-blue-900 mb-4"
            >
              Momentos Destacados
            </motion.h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full"></div>
          </div>
          
          <div className="relative">
            <Swiper
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 200,
                modifier: 1.5,
                slideShadows: false,
              }}
              pagination={{
                clickable: true,
                el: '.swiper-pagination',
                renderBullet: (index, className) => {
                  return `<span class="${className} bg-blue-900 opacity-20 w-3 h-3 mx-1 rounded-full"></span>`;
                },
              }}
              navigation={{
                prevEl: navigationPrevRef.current,
                nextEl: navigationNextRef.current,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
              className="w-full py-8"
              breakpoints={{
                640: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 30,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 40,
                },
              }}
            >
              {galleryImages.slice(0, 6).map((image) => (
                <SwiperSlide key={`featured-${image.id}`} className="!w-[350px] !h-[400px] rounded-2xl overflow-hidden">
                  <div className="relative w-full h-full group">
                    <img
                      src={image.src}
                      alt={`Destacado ${image.id}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div>
                        <span className="inline-block px-3 py-1 bg-yellow-400 text-blue-900 text-xs font-semibold rounded-full mb-2">
                          {image.category}
                        </span>
                        <h3 className="text-white text-xl font-bold">
                          Título del Evento
                        </h3>
                        <p className="text-white/80 text-sm mt-1">Breve descripción del evento destacado</p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            
            <button
              ref={navigationPrevRef}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-300 -ml-6 border border-white/20"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              ref={navigationNextRef}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-300 -mr-6 border border-white/20"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            <div className="swiper-pagination mt-8 flex justify-center gap-2"></div>
          </div>
        </motion.div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-yellow-400 transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <motion.div 
            className="max-w-6xl w-full relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Vista ampliada"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12 text-center">
              <p className="text-white/80 text-sm">Haz clic fuera de la imagen para cerrar</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
