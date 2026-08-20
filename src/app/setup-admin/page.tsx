import { Metadata } from "next";
import { Suspense } from "react";
import { HostSetupForm } from "@/components/admin/HostSetupForm";

export const metadata: Metadata = {
  title: "Configuración Privada del Anfitrión · Baby Revela",
  description: "Registro seguro de usuario y PIN para el anfitrión del evento.",
};

export default function HostSetupPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
      <HostSetupForm />
    </Suspense>
  );
}
