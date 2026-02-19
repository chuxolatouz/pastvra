import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Ayuda</h2>
      <Card>
        <CardTitle>Wizard de pesaje</CardTitle>
        <CardDescription>1. Escanea o escribe chip/arete. 2. Confirma animal. 3. Ingresa peso. 4. Guarda.</CardDescription>
      </Card>
      <Card>
        <CardTitle>Modo offline</CardTitle>
        <CardDescription>
          Si no hay internet, el pesaje se guarda en pendientes. Usa el botón &quot;Sincronizar&quot; al volver
          online.
        </CardDescription>
      </Card>
    </div>
  );
}
