import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Ayuda</h2>
      <Card>
        <CardTitle>Asistente de pesaje</CardTitle>
        <CardDescription>
          1. Escanea o escribe chip/arete/identificador. 2. Confirma animal. 3. Ingresa peso. 4. Guarda.
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>Modo sin conexión</CardTitle>
        <CardDescription>
          Si no hay internet, el pesaje se guarda en pendientes. Usa el botón &quot;Sincronizar&quot; al volver
          a tener conexión.
        </CardDescription>
      </Card>
    </div>
  );
}
