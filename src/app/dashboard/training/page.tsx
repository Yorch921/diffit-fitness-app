import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TrainingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  // Obtener todos los planes de entrenamiento del usuario con sus semanas
  const trainingPlans = await prisma.trainingPlan.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      weeks: {
        orderBy: {
          weekNumber: 'asc',
        },
        include: {
          sessions: {
            orderBy: {
              name: 'asc',
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Plan activo
  const activePlan = trainingPlans.find((plan) => plan.isActive)

  // Planes anteriores (no activos)
  const previousPlans = trainingPlans.filter((plan) => !plan.isActive)

  // Función para determinar la semana actual
  const getCurrentWeek = (plan: typeof activePlan) => {
    if (!plan) return null
    const today = new Date()
    return plan.weeks.find(
      (week) =>
        today >= new Date(week.startDate) && today <= new Date(week.endDate)
    )
  }

  const currentWeek = activePlan ? getCurrentWeek(activePlan) : null

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan de Entrenamiento</h1>
        <p className="mt-2 text-gray-600">
          Consulta tu rutina y realiza tus entrenamientos
        </p>
      </div>

      {/* Plan Activo */}
      {activePlan ? (
        <div className="space-y-6">
          <Card>
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
                    {activePlan.weeks.length} semanas • Inicio: {formatDate(activePlan.startDate)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activePlan.description && (
                <p className="text-gray-600 mb-4">{activePlan.description}</p>
              )}

              {/* Información de semana actual */}
              {currentWeek && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        📅 Semana Actual: Semana {currentWeek.weekNumber}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {formatDate(currentWeek.startDate)} - {formatDate(currentWeek.endDate)}
                      </p>
                    </div>
                    <span className="text-2xl">💪</span>
                  </div>
                </div>
              )}

              {/* Estadísticas del plan */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {activePlan.weeks.length}
                  </div>
                  <p className="text-xs text-gray-600">Semanas</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {activePlan.weeks.reduce((acc, week) => acc + week.sessions.length, 0)}
                  </div>
                  <p className="text-xs text-gray-600">Sesiones</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentWeek ? currentWeek.weekNumber : '-'}
                  </div>
                  <p className="text-xs text-gray-600">Semana actual</p>
                </div>
              </div>

              {/* Botón para ver todas las semanas */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Semanas del Plan</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {activePlan.weeks.map((week) => {
                    const isCurrentWeek = currentWeek?.id === week.id
                    const isFutureWeek = new Date() < new Date(week.startDate)

                    return (
                      <Link
                        key={week.id}
                        href={`/dashboard/training/week/${week.id}`}
                        className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                          isCurrentWeek
                            ? 'border-blue-500 bg-blue-50'
                            : isFutureWeek
                            ? 'border-gray-200 bg-gray-50 opacity-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg font-bold text-gray-900">
                          Semana {week.weekNumber}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {week.sessions.length} sesiones
                        </p>
                        {isCurrentWeek && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            Actual
                          </span>
                        )}
                        {isFutureWeek && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                            Próxima
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-xl font-semibold mb-2">
              No tienes un plan de entrenamiento activo
            </h3>
            <p className="text-gray-600">
              Tu entrenador aún no te ha asignado un plan de ejercicios
            </p>
          </CardContent>
        </Card>
      )}

      {/* Historial de Planes Anteriores */}
      {previousPlans.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Historial de Planes
            </CardTitle>
            <CardDescription>
              Planes de entrenamiento anteriores ({previousPlans.length})
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
                      {plan.weeks.length} semanas • {formatDate(plan.startDate)}
                      {plan.endDate && ` - ${formatDate(plan.endDate)}`}
                    </p>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/dashboard/training/plan/${plan.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      Ver Plan
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje si no hay ningún plan */}
      {trainingPlans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-xl font-semibold mb-2">
              Aún no tienes planes de entrenamiento
            </h3>
            <p className="text-gray-600">
              Tu entrenador te asignará una rutina de ejercicios pronto
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
