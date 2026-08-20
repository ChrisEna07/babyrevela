import { Metadata } from "next";
import { InvitationCard } from "@/components/guest/InvitationCard";

export const metadata: Metadata = {
  title: "Invitación Oficial · Baby Revela",
  description:
    "Confirma tu asistencia y predicción para el Baby Shower y Revelación de Sexo en vivo.",
};

export default function InvitacionPage() {
  return <InvitationCard />;
}
