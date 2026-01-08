import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function NutritionPage() {
  // Datos de ejemplo sin base de datos
  const nutritionPlans: any[] = []
  const activePlan = null

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan Nutricional</h1>
        <p className="mt-2 text-gray-600">
          Visualiza y descarga tu plan de alimentación
        </p>
      </div>

      {activePlan ? (
        <Card>
          <CardHeader>
            <CardTitle>{activePlan.title}</CardTitle>
            <CardDescription>
              Válido desde {formatDate(activePlan.startDate)}
              {activePlan.endDate && ` hasta ${formatDate(activePlan.endDate)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activePlan.description && (
              <p className="text-gray-600 mb-4">{activePlan.description}</p>
            )}
            <div className="aspect-[8.5/11] bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <iframe
                src={activePlan.pdfUrl}
                className="w-full h-full rounded-lg"
                title="Plan Nutricional"
              />
            </div>
            <div className="flex gap-2">
              <a
                href={activePlan.pdfUrl}
                download
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Descargar PDF
              </a>
              <a
                href={activePlan.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🥗</div>
            <h3 className="text-xl font-semibold mb-2">
              No tienes un plan nutricional activo
            </h3>
            <p className="text-gray-600 mb-4">
              En modo demo sin base de datos configurada
            </p>
            <p className="text-sm text-gray-500">
              Configura la base de datos para ver tus planes nutricionales
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
