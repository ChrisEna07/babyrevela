import { Metadata } from "next";
import { Suspense } from "react";
import { InvitationCard } from "@/components/guest/InvitationCard";
import { FullPageLoader } from "@/components/shared/FullPageLoader";

export const metadata: Metadata = {
  title: "Invitación Oficial · Baby Revela",
  description:
    "Confirma tu asistencia presencial o remota para el Baby Shower y Revelación de Sexo en vivo.",
};

export default function InvitacionPage() {
  return (
    <Suspense fallback={<FullPageLoader label="Cargando invitación…" />}>
      <InvitationCard />
    </Suspense>
  );
}
