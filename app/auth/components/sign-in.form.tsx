/* eslint-disable @typescript-eslint/no-explicit-any */
  "uses client";
  import React from "react"; // <-- Agrega esto
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import * as z from "zod";
  import {useForm} from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useState } from "react";
  import { LoaderCircle } from "lucide-react"
import { showToast } from "nextjs-toast-notify";
import { signIn } from "@/lib/data/firebase";

  const SignInForm = () => {
    

      const [isLoading, setisLoading] = useState<boolean>(false)
    
      //? ============== FORMULARIO ============//
      const formSchema = z.object({
          email: z.string().email("Ingresa un correo válido.").min(1, {
              message: 'Este campo es requerido'
          }),
            password: z.string().min(6, {message:"La contraseña debe tener al menos 6 caracteres."})
          });
          
          const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues:{
                email: '',
                password: '',
            }
          })

          const { register, handleSubmit, formState } = form;
          const { errors } = formState;

        //? ============== SING IN =============//

        const onSubmit = async (user: z.infer<typeof formSchema>) => {
          console.log(user);

          setisLoading(true);
          try {
            const res = await signIn(user);
            console.log(res);
              
          } catch (error:any) {
              showToast.error(error.message, {})
              
          }finally{
              setisLoading(false);
          }

        } 

      return (
          <>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="backdrop-blur-md bg-white/70 shadow-lg rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    {...register("email")}
                    id="email"
                    placeholder="Ingresa el correo."
                    type="email"
                    autoComplete="email"
                  />
                  <p className="text-red-500 text-xs mt-1">{errors.email?.message}</p>
                </div>
      
                <div className="space-y-1">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    {...register("password")}
                    id="password"
                    type="password"
                    placeholder="Ingresa la contraseña"
                  />
                  <p className="text-red-500 text-xs mt-1">{errors.password?.message}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  {isLoading && (<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />)}
                  Entrar
                </Button>
                <a href="auth/forgot-password" className="text-blue-500 text-center underline">
                  Olvidaste La Contraseña
                </a>
              </CardFooter>
            </Card>
          </form>
          </>
        );
  }
  export default SignInForm;