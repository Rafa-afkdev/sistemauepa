/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { doc, deleteDoc, serverTimestamp, orderBy, query, collection, where, getDocs } from "firebase/firestore";
import { addDocument, db, getCollection, updateDocument } from "@/lib/firebase";
import { LapsosEscolares } from "@/interfaces/lapsos.interface";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, Lock, MoreHorizontal, Pencil, PlusCircle, Trash2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodosEscolares } from "@/interfaces/periodos-escolares.interface";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

export default function LapsosEscolar() {
  const [lapsos, setLapsos] = useState<LapsosEscolares[]>([]);
  const [periodosEscolares, setPeriodosEscolares] = useState<PeriodosEscolares[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalIdLapso, setOriginalIdLapso] = useState<string>("");
  const [lapsoToDelete, setLapsoToDelete] = useState<LapsosEscolares | null>(null);


  const formSchema = z.object({
    id_lapso: z.string().min(3, "El ID del lapso es requerido"),
    nombre: z.string().min(3, "El nombre del lapso es requerido"),
    año_escolar: z.string().min(1, "El periodo escolar es requerido"),
    status: z.string().min(1, "El estado del lapso es requerido"),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "",
      año_escolar: "",
      id_lapso: "",
      nombre: ""
    }
  });

  const { register, handleSubmit, formState, reset } = form;
  const { errors } = formState;

  const getLapsos = async () => {
    
    const path = "lapsos";
    const queryParams = [orderBy("id_lapso", "asc")];
    setIsLoading(true);
    try {
      const res = await getCollection(path, queryParams) as LapsosEscolares[];
      setLapsos(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLapsos();
  }, []);

  const handleEdit = (lapso: LapsosEscolares) => {
    reset({
      id_lapso: lapso.id_lapso,
      nombre: lapso.nombre,
      año_escolar: lapso.año_escolar,
      status: lapso.status,
    });
    setEditingId(lapso.id ?? null);
    setOriginalIdLapso(lapso.id_lapso);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (lapsoId: string, newStatus: string) => {
    try {
      await updateDocument(`lapsos/${lapsoId}`, { status: newStatus });
      toast.success("Estado actualizado correctamente");
      getLapsos();
    } catch (error) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!lapsoToDelete) return;
    setIsSubmitting(true);
    try {
      if (lapsoToDelete?.id) {
        await deleteDoc(doc(db, "lapsos", lapsoToDelete.id));
      } else {
        throw new Error("El ID del lapso a eliminar no está definido.");
      }
      toast.success("Lapso eliminado correctamente");
      getLapsos();
      setLapsoToDelete(null);
    } catch (error: any) {
      toast.error("Error al eliminar el lapso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
  
    try {
      // Validar ID único
      if (!editingId || data.id_lapso !== originalIdLapso) {
        const q = query(
          collection(db, "lapsos"),
          where("id_lapso", "==", data.id_lapso)
        );
        const querySnapshot = await getDocs(q);
        const exists = querySnapshot.docs.some(doc => 
          editingId ? doc.id !== editingId : true
        );
  
        if (exists) {
          toast.error("Ya existe un lapso con este ID");
          return;
        }
      }
  
      // Validar que no haya otro lapso con el mismo nombre y periodo escolar
      const qNombrePeriodo = query(
        collection(db, "lapsos"),
        where("nombre", "==", data.nombre),
        where("año_escolar", "==", data.año_escolar)
      );
      const querySnapshotNombrePeriodo = await getDocs(qNombrePeriodo);
      const existsNombrePeriodo = querySnapshotNombrePeriodo.docs.some(doc =>
        editingId ? doc.id !== editingId : true
      );
  
      if (existsNombrePeriodo) {
        toast.error("Ya existe un lapso con este nombre y periodo escolar");
        return;
      }
  
      // Validar que solo un lapso pueda estar activo
      if (data.status === "ACTIVO") {
        const qActivo = query(
          collection(db, "lapsos"),
          where("status", "==", "ACTIVO")
        );
        const querySnapshotActivo = await getDocs(qActivo);
        const existsActivo = querySnapshotActivo.docs.some(doc =>
          editingId ? doc.id !== editingId : true
        );
  
        if (existsActivo) {
          toast.error("Error. Ya existe un lapso activo");
          return;
        }
      }
  
      // Continuar con la creación o actualización del lapso
      if (editingId) {
        await updateDocument(`lapsos/${editingId}`, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        toast.success("Lapso actualizado exitosamente");
      } else {
        const nuevoLapso: Omit<LapsosEscolares, "id"> = {
          id_lapso: data.id_lapso,
          nombre: data.nombre,
          año_escolar: data.año_escolar,
          status: data.status,
        };
        await addDocument("lapsos", nuevoLapso);
        toast.success("Lapso creado exitosamente");
      }
  
      getLapsos();
      setIsDialogOpen(false);
      reset();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchPeriodos = async () => {
      const path = "periodos_escolares"; // Asegurar que coincida con la colección en Firestore
      const queryParams = [orderBy("periodo", "asc")];
      try {
        const res = await getCollection(path, queryParams) as PeriodosEscolares[];
        
        // Ordenar periodos: primero ACTIVO, luego otros estados ordenados alfabéticamente
        const sortedPeriodos = res.sort((a, b) => {
          if (a.status === 'ACTIVO' && b.status !== 'ACTIVO') return -1;
          if (b.status === 'ACTIVO' && a.status !== 'ACTIVO') return 1;
          return a.periodo.localeCompare(b.periodo);
        });
        
        setPeriodosEscolares(sortedPeriodos);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPeriodos();
  }, []);

  return (
    <Card>
      <CardHeader>
      <div className="flex justify-between items-center">          
      
        <CardTitle className="text-2xl">Lapsos Escolares</CardTitle>
        <CardDescription>
          <div className="flex justify-end mt-4">
            
            <Button variant={"outline"} onClick={() => setIsDialogOpen(true)}>
              Nuevo Lapso
              <PlusCircle className="ml-2 w-5" />
            </Button>
          </div>
        </CardDescription>
      </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : lapsos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Periodo Escolar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lapsos.map((lapso) => (
                <TableRow key={lapso.id_lapso}>
                  <TableCell>{lapso.id_lapso}</TableCell>
                  <TableCell>{lapso.nombre}</TableCell>
                  <TableCell>{lapso.año_escolar}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      lapso.status === "ACTIVO" ? "bg-green-100 text-green-800" :
                      lapso.status === "BLOQUEADO" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {lapso.status}
                    </span>
                  </TableCell>
                  <TableCell>
                  <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="h-8 w-8 p-0">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Editar */}
    <DropdownMenuItem 
      onClick={() => handleEdit(lapso)}
      className="text-blue-600 focus:bg-blue-50"
    >
      <Pencil className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>

    {/* Eliminar */}
    <DropdownMenuItem 
      onClick={() => setLapsoToDelete(lapso)}
      className="text-red-600 focus:bg-red-50"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Eliminar
    </DropdownMenuItem>

    {/* Activar */}
    <DropdownMenuItem 
      onClick={() => lapso.id && handleStatusChange(lapso.id, "ACTIVO")}
      disabled={lapso.status === "ACTIVO"}
      className="text-green-600 focus:bg-green-50"
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Activar
    </DropdownMenuItem>

    {/* Bloquear */}
    <DropdownMenuItem 
      onClick={() => lapso.id && handleStatusChange(lapso.id, "BLOQUEADO")}
      disabled={lapso.status === "BLOQUEADO"}
      className="text-yellow-600 focus:bg-yellow-50"
    >
      <Lock className="mr-2 h-4 w-4" />
      Bloquear
    </DropdownMenuItem>

    {/* Cerrar */}
    <DropdownMenuItem 
      onClick={() => lapso.id && handleStatusChange(lapso.id, "CERRADO")}
      disabled={lapso.status === "CERRADO"}
      className="text-gray-600 focus:bg-gray-50"
    >
      <XCircle className="mr-2 h-4 w-4" />
      Cerrar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground text-center py-10">
            No se encontraron lapsos registrados
          </div>
        )}
      </CardContent>
      

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="sm:max-w-[425px]"> {/* Reducir el tamaño del diálogo */}
    <DialogHeader>
      <DialogTitle>{editingId ? "Editar" : "Nuevo"} Lapso Escolar</DialogTitle>
      <DialogDescription>
        Complete todos los campos requeridos para {editingId ? "actualizar" : "crear"} el lapso
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4">
        {/* ID del Lapso */}
        <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="id_lapso" className="text-right">
        ID
          </label>
          <Input
            id="id_lapso"
            {...register("id_lapso")}
            placeholder="Ej: LAPSO-2024-01"
            disabled={isSubmitting}
            className="col-span-3"
          />
          {errors.id_lapso && (
            <p className="col-span-4 text-red-500 text-sm text-right">
              {errors.id_lapso.message}
            </p>
          )}
        </div>

        {/* Lapso */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="nombre" className="text-right">
            Lapso
          </label>
          <Select
            value={form.watch("nombre")}
            disabled={isSubmitting}
            onValueChange={(value: string) => {
              form.setValue("nombre", value, {
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Seleccione el periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="LAPSO 1">Lapso 1</SelectItem>
                <SelectItem value="LAPSO 2">Lapso 2</SelectItem>
                <SelectItem value="LAPSO 3">Lapso 3</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Periodo Escolar */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="año_escolar" className="text-right">
            Periodo 
          </label>
          <Select
            onValueChange={(value) => form.setValue("año_escolar", value)}
            value={form.watch("año_escolar")}
            disabled={isSubmitting}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Seleccione el periodo escolar" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Periodo Activo</SelectLabel>
                {periodosEscolares
                  .filter((periodo) => periodo.status === "ACTIVO")
                  .map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.periodo}>
                      {periodo.periodo}
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Otros Periodos</SelectLabel>
                {periodosEscolares
                  .filter((periodo) => periodo.status !== "ACTIVO")
                  .map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.periodo}>
                      {periodo.periodo}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.año_escolar && (
            <p className="col-span-4 text-red-500 text-sm text-right">
              {errors.año_escolar.message}
            </p>
          )}
        </div>

        {/* Estado */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="status" className="text-right">
            Estado
          </label>
          <Select
            onValueChange={(value) => form.setValue("status", value)}
            value={form.watch("status")}
            disabled={isSubmitting}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
              <SelectItem value="CERRADO">Cerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsDialogOpen(false);
            reset();
            setEditingId(null);
          }}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editingId ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>

      <Dialog open={!!lapsoToDelete} onOpenChange={(open) => !open && setLapsoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar lapso?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar el lapso {lapsoToDelete?.id_lapso}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setLapsoToDelete(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}