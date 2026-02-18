/* eslint-disable react/no-unescaped-entities */
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarX, LayoutList, SquarePen, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { where } from "firebase/firestore";
import React from "react";
import { CreateUpdatePeriodoEscolar } from "./create-update-periodos-escolares.form";
import { getCollection, updateDocument } from "@/lib/data/firebase";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/data/firebase";
import { showToast } from "nextjs-toast-notify";
import { sendVerificationCode, verifyCode } from "@/actions/verification-code";

export function TableViewPeriodoEscolar({
  periodos_escolares,
  deletePeriodo_escolar,
  getPeriodosEscolares,
  isLoading,
}: {
  periodos_escolares: PeriodosEscolares[];
  deletePeriodo_escolar: (periodo_escolar: PeriodosEscolares) => Promise<void>;
  getPeriodosEscolares: () => Promise<void>; 
  isLoading: boolean;
}) {
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodosEscolares | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Función para confirmar el cambio de estado
  const confirmStatusChange = (periodo_escolar: PeriodosEscolares) => {
    setSelectedPeriodo(periodo_escolar);
    setVerificationCode("");
    setAuthError(null);
    setCodeSent(false);
    setCurrentEmail(auth.currentUser?.email ?? "");
    setOpenDialog(true);
  };

  // Función para enviar código de verificación
  const handleSendCode = async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      setAuthError("No hay un usuario autenticado.");
      showToast.error("No hay un usuario autenticado.", {});
      return;
    }

    setIsSendingCode(true);
    setAuthError(null);

    try {
      const result = await sendVerificationCode(email);
      if (result.success) {
        setCodeSent(true);
        showToast.success("Código enviado a tu correo electrónico.", {});
      } else {
        setAuthError(result.error || "Error al enviar el código");
        showToast.error(result.error || "Error al enviar el código", {});
      }
    } catch (error) {
      setAuthError("Error al enviar el código de verificación");
      showToast.error("Error al enviar el código de verificación", {});
    } finally {
      setIsSendingCode(false);
    }
  };

  const updateStudentsToRetired = async (periodoId: string) => {
    try {
      const estudiantes: any[] = await getCollection("estudiantes", [
        where("estado", "==", "INSCRITO"),
      ]);
      await Promise.all(
        estudiantes.map((st: any) =>
          updateDocument(`estudiantes/${st.id}`, { estado: "RETIRADO" })
        )
      );
      console.log(`Todos los estudiantes del período ${periodoId} han sido actualizados a RETIRADO.`);
    } catch (error) {
      console.error("Error al actualizar estudiantes a RETIRADO:", error);
    }
  };
  // Función para actualizar el estado del período escolar a "INACTIVO"
  const setPeriodoInactivo = async () => {
    if (!selectedPeriodo) return;
    try {
      setAuthError(null);
      setIsProcessing(true);
      const user = auth.currentUser;
      if (!user || !user.email) {
        setAuthError("No hay un usuario autenticado.");
        showToast.error("No hay un usuario autenticado.", {});
        return;
      }

      if (!codeSent) {
        setAuthError("Debes solicitar un código de verificación primero.");
        showToast.error("Debes solicitar un código de verificación primero.", {});
        return;
      }

      if (!verificationCode || verificationCode.length !== 6) {
        setAuthError("Debes ingresar el código de 6 dígitos.");
        showToast.error("Debes ingresar el código de 6 dígitos.", {});
        return;
      }

      // Verify code
      const verifyResult = await verifyCode(user.email, verificationCode);
      if (!verifyResult.success) {
        setAuthError(verifyResult.error || "Código inválido");
        showToast.error(verifyResult.error || "Código inválido", {});
        return;
      }

      // Code verified, proceed with update
      await updateDocument(`periodos_escolares/${selectedPeriodo.id}`, { status: "INACTIVO" });
      console.log(`El período escolar ${selectedPeriodo.periodo} ha sido actualizado a INACTIVO.`);
      if (selectedPeriodo.id) {
        await updateStudentsToRetired(selectedPeriodo.id);
      } else {
        console.error("El ID del período seleccionado es indefinido.");
      }
      await getPeriodosEscolares();
      
      // success -> close dialog
      showToast.success("Período escolar actualizado a INACTIVO.", {});
      setOpenDialog(false);
      setSelectedPeriodo(null);
      setVerificationCode("");
      setCodeSent(false);
      setAuthError(null);
    } catch (error) {
      console.error("Error al actualizar el estado del período escolar:", error);
      setAuthError("Error al actualizar el período escolar.");
      showToast.error("Error al actualizar el período escolar.", {});
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para eliminar un período escolar
  const handleDelete = async () => {
    if (!selectedPeriodo) return;
    try {
      await deletePeriodo_escolar(selectedPeriodo);
      console.log(`El período escolar ${selectedPeriodo.periodo} ha sido eliminado.`);
    } catch (error) {
      console.error("Error al eliminar el período escolar:", error);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedPeriodo(null);
    }
  };

  return (
    <>
      {/* Estilos personalizados para el scroll */}
      <style>
        {`
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: white transparent;
          }
          .custom-scroll::-webkit-scrollbar { width: 8px; }
          .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-scroll::-webkit-scrollbar-thumb { background: white; border-radius: 4px; }
          .custom-scroll::-webkit-scrollbar-thumb:hover { background: #f0f0f0; }
        `}
      </style>

      <div className="custom-scroll max-h-[600px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              periodos_escolares &&
              periodos_escolares.map((periodo_escolar) => (
                <TableRow key={periodo_escolar.id}>
                  <TableCell>{periodo_escolar.periodo}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      periodo_escolar.status === "ACTIVO"
                        ? "bg-green-100 text-green-800"
                        : periodo_escolar.status === "INACTIVO"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {periodo_escolar.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {periodo_escolar.status === "ACTIVO" && (
                      <Button
                        className="p-0.5 mx-1 border-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        variant="outline"
                        onClick={() => confirmStatusChange(periodo_escolar)}
                      >
                        <CalendarX className="w-4 h-4" />
                      </Button>
                    )}
                    <CreateUpdatePeriodoEscolar
                      getPeriodos_Escolares={getPeriodosEscolares}
                      periodoToUpdate={periodo_escolar}
                    >
                      <Button className="p-0.5 mx-1 border-0" variant="outline">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </CreateUpdatePeriodoEscolar>
                    <Button
                      variant="outline"
                      className="p-0.5 mx-1 border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSelectedPeriodo(periodo_escolar);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {isLoading &&
              [1, 1, 1].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="w-full h-4" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
        {!isLoading && periodos_escolares.length === 0 && (
          <div className="text-gray-200 my-20">
            <div className="flex justify-center">
              <LayoutList className="w-[120px] h-[120px]" />
            </div>
            <h2 className="text-center">No se encontraron periodos escolares existentes</h2>
          </div>
        )}
      </div>

      {/* Dialog de confirmación para cambiar estado */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
          </DialogHeader>
          <p>¿Deseas cambiar el estado del período escolar {selectedPeriodo?.periodo} a INACTIVO?</p>
          <div className="space-y-3 mt-4">
            {currentEmail && (
              <p className="text-sm text-gray-700">Usuario: <span className="font-medium">{currentEmail}</span></p>
            )}
            
            {!codeSent ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Para confirmar esta acción, te enviaremos un código de verificación a tu correo electrónico.</p>
                <Button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSendingCode ? "Enviando..." : "Enviar código de verificación"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Ingresa el código de 6 dígitos enviado a tu correo</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="w-full text-sm"
                >
                  {isSendingCode ? "Reenviando..." : "Reenviar código"}
                </Button>
              </div>
            )}
            
            {authError && (
              <p className="text-red-600 text-sm">{authError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={setPeriodoInactivo}
              disabled={isProcessing || !codeSent || verificationCode.length !== 6}
            >
              {isProcessing ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas eliminar este período escolar?</AlertDialogTitle>
            <AlertDialogDescription>
              Presiona en "Confirmar" para eliminar este período escolar. Recuerda que esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600" onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
