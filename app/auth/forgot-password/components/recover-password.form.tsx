/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import React from "react"; // <-- Agrega esto
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { sentResetEmail } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";

const RecoverPassword = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  //? ============== FORMULARIO ============//
  const formSchema = z.object({
    email: z.string().email("Ingresa un correo válido.").min(1, {
      message: "Este campo es obligatorio.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  //? ============== RECOVER PASSWORD =============//
  const onSubmit = async (user: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {

      await sentResetEmail(user.email);
      showToast.success('Verifica tu correo para recuperar tu contraseña.');
      router.push('/auth');
      
    } catch (error) {     
      showToast.error('Ocurrió un error al enviar el correo de recuperación. Intenta nuevamente.'); 
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="backdrop-blur-md bg-white/70 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>Ingresa el correo asignado para recuperar la cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="email">Correo</Label>
            <Input
              {...register("email")}
              id="email"
              placeholder="Ingresa un correo válido."
              type="email"
              autoComplete="email"
            />
            <p className="text-red-500 text-xs mt-1">{errors.email?.message}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Enviar
          </Button>
          <a href="/auth" className="text-blue-500 text-center underline">
            Volver al inicio
          </a>
        </CardFooter>
      </Card>
    </form>
  );
};

export default RecoverPassword;
