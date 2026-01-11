import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function NutritionPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  // Obtener todos los planes nutricionales del usuario
  const nutritionPlans = await prisma.nutritionPlan.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Plan activo
  const activePlan = nutritionPlans.find((plan) => plan.isActive)

  // Planes anteriores (no activos)
  const previousPlans = nutritionPlans.filter((plan) => !plan.isActive)

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan Nutricional</h1>
        <p className="mt-2 text-gray-600">
          Visualiza y descarga tu plan de alimentación
        </p>
      </div>

      {/* Plan Activo */}
      {activePlan ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    ACTIVO
                  </span>
                  {activePlan.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  Válido desde {formatDate(activePlan.startDate)}
                  {activePlan.endDate && ` hasta ${formatDate(activePlan.endDate)}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activePlan.description && (
              <p className="text-gray-600 mb-4">{activePlan.description}</p>
            )}

            {/* Visor de PDF */}
            <div className="border rounded-lg overflow-hidden mb-4 bg-gray-50">
              <iframe
                src={activePlan.pdfUrl}
                className="w-full h-[600px]"
                title="Plan Nutricional"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <a
                href={activePlan.pdfUrl}
                download
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                📥 Descargar PDF
              </a>
              <a
                href={activePlan.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                🔗 Abrir en nueva pestaña
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🥗</div>
            <h3 className="text-xl font-semibold mb-2">
              No tienes un plan nutricional activo
            </h3>
            <p className="text-gray-600">
              Tu entrenador aún no te ha asignado un plan de alimentación
            </p>
          </CardContent>
        </Card>
      )}

      {/* Historial de Planes Anteriores */}
      {previousPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Historial de Planes
            </CardTitle>
            <CardDescription>
              Planes nutricionales anteriores ({previousPlans.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previousPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{plan.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(plan.startDate)}
                      {plan.endDate && ` - ${formatDate(plan.endDate)}`}
                    </p>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <a
                      href={plan.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      Ver PDF
                    </a>
                    <a
                      href={plan.pdfUrl}
                      download
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      📥
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje si no hay ningún plan */}
      {nutritionPlans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🥗</div>
            <h3 className="text-xl font-semibold mb-2">
              Aún no tienes planes nutricionales
            </h3>
            <p className="text-gray-600">
              Tu entrenador te asignará un plan de alimentación pronto
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
