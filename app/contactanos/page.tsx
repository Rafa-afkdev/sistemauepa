'use client';

import { sendEmail } from '@/actions/send-email';
import FooterLanding from '@/app/components/FooterLanding';
import NavbarMain from '@/app/components/NavbarMain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { showToast } from 'nextjs-toast-notify';
import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  subject: z.string().min(5, { message: 'El asunto debe tener al menos 5 caracteres' }),
  message: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres' }),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(sendEmail, {});
  
  const {
    register,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (state.success) {
      showToast.success('¡Mensaje enviado correctamente!', {
        duration: 4000,
        progress: true,
        position: 'bottom-right',
        transition: 'bounceIn',
        icon: '',
      });
      reset();
    } else if (state.error) {
      showToast.error(state.error, {
        duration: 4000,
        progress: true,
        position: 'bottom-right',
        transition: 'bounceIn',
        icon: '',
      });
    }
  }, [state, reset]);

  return (
    <main className="bg-white">
      <NavbarMain />
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/28.webp"
            alt="Contacto background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[50vh] flex items-center">
          <div className="max-w-4xl text-center mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/30">
                <p className="text-white font-bold text-sm tracking-wider">CONTÁCTANOS</p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Estamos aquí para ti
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/90 mb-8 leading-relaxed"
            >
              ¿Tienes alguna pregunta o comentario? Completa el formulario y nos pondremos en contacto contigo lo antes posible.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Phone Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-blue-600"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Teléfono</h3>
              <p className="text-gray-600">+58 (123) 456-7890</p>
            </motion.div>

            {/* Email Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-red-600"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Email</h3>
              <p className="text-gray-600">info@colegiouepa.com</p>
            </motion.div>

            {/* Location Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-yellow-500"
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ubicación</h3>
              <p className="text-gray-600">Guarenas, Estado Miranda, Venezuela</p>
            </motion.div>
          </div>

          {/* Contact Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-blue-900 mb-4">
                Envíanos un mensaje
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 via-red-600 to-blue-900 mx-auto rounded-full"></div>
            </div>

            <Card className="shadow-2xl border-gray-100 bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-white pb-8">
                <CardTitle className="text-2xl font-bold text-blue-900">
                  Formulario de Contacto
                </CardTitle>
                <CardDescription className="text-base mt-2 text-gray-600">
                  Completa los campos a continuación y te responderemos pronto.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form action={formAction} className='space-y-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='name' className='text-gray-700 font-medium'>
                      Nombre Completo
                    </Label>
                    <Input
                      id='name'
                      placeholder='Ej: Juan Pérez'
                      {...register('name')}
                      className={`transition-all duration-200 ${
                        errors.name || state.errors?.name
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : 'focus:border-blue-500 focus-visible:ring-blue-500/20'
                      }`}
                    />
                    {(errors.name || state.errors?.name) && (
                      <p className='text-sm text-red-500 animate-in fade-in slide-in-from-top-1 duration-200'>
                        {errors.name?.message || state.errors?.name?.[0]}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='email' className='text-gray-700 font-medium'>
                      Correo Electrónico
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Ej: juan@ejemplo.com'
                      {...register('email')}
                      className={`transition-all duration-200 ${
                        errors.email || state.errors?.email
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : 'focus:border-blue-500 focus-visible:ring-blue-500/20'
                      }`}
                    />
                    {(errors.email || state.errors?.email) && (
                      <p className='text-sm text-red-500 animate-in fade-in slide-in-from-top-1 duration-200'>
                        {errors.email?.message || state.errors?.email?.[0]}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='subject' className='text-gray-700 font-medium'>
                      Asunto
                    </Label>
                    <Input
                      id='subject'
                      placeholder='Ej: Información sobre inscripciones'
                      {...register('subject')}
                      className={`transition-all duration-200 ${
                        errors.subject || state.errors?.subject
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : 'focus:border-blue-500 focus-visible:ring-blue-500/20'
                      }`}
                    />
                    {(errors.subject || state.errors?.subject) && (
                      <p className='text-sm text-red-500 animate-in fade-in slide-in-from-top-1 duration-200'>
                        {errors.subject?.message || state.errors?.subject?.[0]}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='message' className='text-gray-700 font-medium'>
                      Mensaje
                    </Label>
                    <Textarea
                      id='message'
                      placeholder='Escribe tu mensaje aquí...'
                      className={`min-h-[150px] resize-none transition-all duration-200 ${
                        errors.message || state.errors?.message
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : 'focus:border-blue-500 focus-visible:ring-blue-500/20'
                      }`}
                      {...register('message')}
                    />
                    {(errors.message || state.errors?.message) && (
                      <p className='text-sm text-red-500 animate-in fade-in slide-in-from-top-1 duration-200'>
                        {errors.message?.message || state.errors?.message?.[0]}
                      </p>
                    )}
                  </div>

                  <Button
                    type='submit'
                    className='w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className='mr-2 h-5 w-5' />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <FooterLanding />
    </main>
  );
}
