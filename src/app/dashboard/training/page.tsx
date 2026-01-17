import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MarkSectionSeen from '@/components/MarkSectionSeen'

export default async function TrainingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  // Obtener mesociclo activo con template completo
  const activeMesocycle = await prisma.clientMesocycle.findFirst({
    where: {
      clientId: session.user.id,
      isActive: true,
    },
    include: {
      template: {
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: {
                  sets: {
                    orderBy: { setNumber: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
      trainer: {
        select: {
          name: true,
        },
      },
      microcycles: {
        orderBy: { weekNumber: 'asc' },
        include: {
          _count: {
            select: { workoutDayLogs: true },
          },
        },
      },
    },
  })

  // Obtener mesociclos completados para historial
  const completedMesocycles = await prisma.clientMesocycle.findMany({
    where: {
      clientId: session.user.id,
      isCompleted: true,
    },
    include: {
      template: {
        select: {
          title: true,
          description: true,
          numberOfDays: true,
        },
      },
      trainer: {
        select: {
          name: true,
        },
      },
      _count: {
        select: { microcycles: true },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  // Función para determinar la semana actual basada en registros
  // La semana actual es la última que tiene registros de entrenamiento
  const getCurrentMicrocycle = () => {
    if (!activeMesocycle) return null

    // Buscar la última semana con registros
    const weeksWithLogs = activeMesocycle.microcycles.filter(
      (m) => m._count.workoutDayLogs > 0
    )

    if (weeksWithLogs.length > 0) {
      // La semana actual es la última con registros
      return weeksWithLogs[weeksWithLogs.length - 1]
    }

    // Si no hay registros, la primera semana es la actual
    return activeMesocycle.microcycles[0] || null
  }

  const currentMicrocycle = activeMesocycle ? getCurrentMicrocycle() : null
  const currentWeekNumber = currentMicrocycle?.weekNumber || 1

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Marcar seccion como vista */}
      <MarkSectionSeen section="training" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Entrenamiento</h1>
        <p className="mt-2 text-gray-600">
          Consulta tu plan y registra tus entrenamientos
        </p>
      </div>

      {/* Plan Activo */}
      {activeMesocycle ? (
        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan">Mi Plan Actual</TabsTrigger>
            <TabsTrigger value="registro">Registro de Entrenamientos</TabsTrigger>
          </TabsList>

          {/* Tab 1: Mi Plan Actual (Solo lectura) */}
          <TabsContent value="plan" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ACTIVO
                      </span>
                      {activeMesocycle.template.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {activeMesocycle.durationWeeks} semanas • {activeMesocycle.template.numberOfDays} días por semana
                      <br />
                      Inicio: {formatDate(activeMesocycle.startDate)} • Fin: {formatDate(activeMesocycle.endDate)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeMesocycle.template.description && (
                  <p className="text-gray-600 mb-6">{activeMesocycle.template.description}</p>
                )}

                {/* Estadísticas del mesociclo */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {activeMesocycle.durationWeeks}
                    </div>
                    <p className="text-xs text-gray-600">Semanas totales</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {activeMesocycle.template.numberOfDays}
                    </div>
                    <p className="text-xs text-gray-600">Días/semana</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {currentMicrocycle ? currentMicrocycle.weekNumber : '-'}
                    </div>
                    <p className="text-xs text-gray-600">Semana actual</p>
                  </div>
                </div>

                {/* Estructura del template (días) */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Estructura de la Semana Tipo</h4>
                  {activeMesocycle.template.days.map((day) => (
                    <Card key={day.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg">{day.name}</CardTitle>
                        {day.description && (
                          <CardDescription>{day.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {day.exercises.map((exercise, idx) => (
                            <div key={exercise.id} className="border-l-2 border-gray-200 pl-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">
                                    {idx + 1}. {exercise.name}
                                  </h5>
                                  {exercise.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {exercise.description}
                                    </p>
                                  )}
                                  {exercise.trainerComment && (
                                    <p className="text-sm text-blue-600 mt-1 italic">
                                      💬 {exercise.trainerComment}
                                    </p>
                                  )}
                                  <div className="mt-2 space-y-1">
                                    {exercise.sets.map((set) => (
                                      <div key={set.id} className="text-sm text-gray-700">
                                        <span className="font-medium">Serie {set.setNumber}:</span>{' '}
                                        {set.minReps === set.maxReps
                                          ? `${set.minReps} reps`
                                          : `${set.minReps}-${set.maxReps} reps`}
                                        {set.restSeconds && (
                                          <span className="text-gray-500">
                                            {' • '}
                                            Descanso: {set.restSeconds}s
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Registro de Entrenamientos */}
          <TabsContent value="registro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Entrenamientos</CardTitle>
                <CardDescription>
                  Registra tus sesiones completadas semana por semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentMicrocycle && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          📅 Semana Actual: Semana {currentMicrocycle.weekNumber}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Ultimo registro en semana {currentMicrocycle.weekNumber} - Puedes registrar hasta semana {currentWeekNumber + 1}
                        </p>
                      </div>
                      <span className="text-2xl">💪</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Semanas del Mesociclo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {activeMesocycle.microcycles.map((microcycle) => {
                      const isCurrentWeek = currentMicrocycle?.id === microcycle.id
                      const logsCount = microcycle._count.workoutDayLogs
                      const isNextWeek = microcycle.weekNumber === currentWeekNumber + 1
                      // Una semana es accesible si: es la actual, es la siguiente, o tiene registros
                      const hasLogs = logsCount > 0
                      const isAccessible = isCurrentWeek || isNextWeek || hasLogs

                      return (
                        <Link
                          key={microcycle.id}
                          href={`/dashboard/training/log/microcycle/${microcycle.weekNumber}`}
                          className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                            isCurrentWeek
                              ? 'border-blue-500 bg-blue-50'
                              : isNextWeek
                              ? 'border-green-300 bg-green-50 hover:border-green-400'
                              : !isAccessible
                              ? 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-lg font-bold text-gray-900">
                            S{microcycle.weekNumber}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {logsCount > 0 ? `${logsCount} registros` : 'Sin registros'}
                          </p>
                          {isCurrentWeek && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              Actual
                            </span>
                          )}
                          {isNextWeek && !hasLogs && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                              Siguiente
                            </span>
                          )}
                          {!isAccessible && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                              Bloqueada
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

      {/* Historial de Mesociclos Anteriores */}
      {completedMesocycles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Historial de Mesociclos
            </CardTitle>
            <CardDescription>
              Mesociclos completados ({completedMesocycles.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedMesocycles.map((mesocycle) => (
                <div
                  key={mesocycle.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{mesocycle.template.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {mesocycle.durationWeeks} semanas • {formatDate(mesocycle.startDate)} - {formatDate(mesocycle.endDate)}
                    </p>
                    {mesocycle.template.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {mesocycle.template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/dashboard/training/history/${mesocycle.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      Ver Detalle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
