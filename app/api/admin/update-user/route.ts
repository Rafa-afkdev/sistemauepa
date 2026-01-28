import { getAdminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, password } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "UID es requerido" }, { status: 400 });
    }

    // Inicializar y obtener Admin Auth de forma segura
    const auth = getAdminAuth();

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
         return NextResponse.json({ message: "Nada que actualizar" }, { status: 200 });
    }

    const userRecord = await auth.updateUser(uid, updateData);

    return NextResponse.json({ success: true, data: userRecord }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message || "Error al actualizar usuario" }, { status: 500 });
  }
}
