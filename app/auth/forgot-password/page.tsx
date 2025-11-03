import { Metadata } from "next";
import RecoverPassword from "./components/recover-password.form";
import React from "react"; // <-- Agrega esto
export const metadata: Metadata = {
    title: "Recuperar Contraseña"
}

const ForgotPassword = () => {
    return (

        <div className="pt-10 lg:p-8 flex items-center md:h-[70vh]">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
                <RecoverPassword/>
            </div>        
        </div>
    );
}
export default ForgotPassword;