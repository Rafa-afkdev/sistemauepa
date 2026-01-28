import { getAdminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "UID es requerido" }, { status: 400 });
    }

    // Inicializar y obtener Admin Auth de forma segura
    const auth = getAdminAuth();

    await auth.deleteUser(uid);

    return NextResponse.json({ success: true, message: "Usuario eliminado de Auth correctamente" }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message || "Error al eliminar usuario" }, { status: 500 });
  }
}
