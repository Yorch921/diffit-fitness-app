import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import MesocycleHistoryCharts from '@/components/MesocycleHistoryCharts'

export default async function MesocycleHistoryPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  const mesocycle = await prisma.clientMesocycle.findFirst({
    where: {
      id: params.id,
      clientId: session.user.id,
    },
    include: {
      template: {
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              exercises: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
      trainer: {
        select: {
          name: true,
          email: true,
        },
      },
      microcycles: {
        orderBy: { weekNumber: 'asc' },
        include: {
          workoutDayLogs: {
            include: {
              templateDay: {
                select: {
                  name: true,
                },
              },
              exerciseLogs: {
                include: {
                  exercise: {
                    select: {
                      name: true,
                    },
                  },
                  setLogs: {
                    orderBy: { setNumber: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!mesocycle) {
    notFound()
  }

  // Calcular estadísticas
  const totalWorkouts = mesocycle.microcycles.reduce(
    (acc, micro) => acc + micro.workoutDayLogs.length,
    0
  )
  const totalSets = mesocycle.microcycles.reduce(
    (acc, micro) =>
      acc +
      micro.workoutDayLogs.reduce(
        (sum, log) =>
          sum +
          log.exerciseLogs.reduce((total, exLog) => total + exLog.setLogs.length, 0),
        0
      ),
    0
  )
  const totalReps = mesocycle.microcycles.reduce(
    (acc, micro) =>
      acc +
      micro.workoutDayLogs.reduce(
        (sum, log) =>
          sum +
          log.exerciseLogs.reduce(
            (total, exLog) =>
              total + exLog.setLogs.reduce((reps, set) => reps + set.reps, 0),
            0
          ),
        0
      ),
    0
  )
  const totalVolume = mesocycle.microcycles.reduce(
    (acc, micro) =>
      acc +
      micro.workoutDayLogs.reduce(
        (sum, log) =>
          sum +
          log.exerciseLogs.reduce(
            (total, exLog) =>
              total +
              exLog.setLogs.reduce(
                (vol, set) => vol + set.reps * set.weight,
                0
              ),
            0
          ),
        0
      ),
    0
  )

  const avgRPE =
    mesocycle.microcycles.reduce(
      (acc, micro) =>
        acc +
        micro.workoutDayLogs.reduce((sum, log) => sum + (log.rpe || 0), 0),
      0
    ) / totalWorkouts || 0

  // Preparar datos para gráficas (progresión de volumen por semana)
  const weeklyData = mesocycle.microcycles.map((micro) => {
    const weekVolume = micro.workoutDayLogs.reduce(
      (sum, log) =>
        sum +
        log.exerciseLogs.reduce(
          (total, exLog) =>
            total +
            exLog.setLogs.reduce((vol, set) => vol + set.reps * set.weight, 0),
          0
        ),
      0
    )
    const weekSets = micro.workoutDayLogs.reduce(
      (sum, log) =>
        sum +
        log.exerciseLogs.reduce((total, exLog) => total + exLog.setLogs.length, 0),
      0
    )
    const avgWeekRPE = micro.workoutDayLogs.length > 0
      ? micro.workoutDayLogs.reduce((sum, log) => sum + (log.rpe || 0), 0) /
        micro.workoutDayLogs.length
      : 0

    return {
      weekNumber: micro.weekNumber,
      volume: Math.round(weekVolume),
      sets: weekSets,
      workouts: micro.workoutDayLogs.length,
      avgRPE: parseFloat(avgWeekRPE.toFixed(1)),
    }
  })

  // Serializar datos
  const serializedMesocycle = {
    ...mesocycle,
    startDate: mesocycle.startDate.toISOString(),
    endDate: mesocycle.endDate.toISOString(),
    completedAt: mesocycle.completedAt?.toISOString() || null,
    createdAt: mesocycle.createdAt.toISOString(),
    updatedAt: mesocycle.updatedAt.toISOString(),
    template: {
      ...mesocycle.template,
      createdAt: mesocycle.template.createdAt.toISOString(),
      updatedAt: mesocycle.template.updatedAt.toISOString(),
      days: mesocycle.template.days.map((day) => ({
        ...day,
        createdAt: day.createdAt.toISOString(),
        updatedAt: day.updatedAt.toISOString(),
        exercises: day.exercises.map((ex) => ({
          ...ex,
          createdAt: ex.createdAt.toISOString(),
          updatedAt: ex.updatedAt.toISOString(),
        })),
      })),
    },
    microcycles: mesocycle.microcycles.map((micro) => ({
      ...micro,
      startDate: micro.startDate.toISOString(),
      endDate: micro.endDate.toISOString(),
      createdAt: micro.createdAt.toISOString(),
      updatedAt: micro.updatedAt.toISOString(),
      workoutDayLogs: micro.workoutDayLogs.map((log) => ({
        ...log,
        completedDate: log.completedDate.toISOString(),
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
        exerciseLogs: log.exerciseLogs.map((exLog) => ({
          ...exLog,
          createdAt: exLog.createdAt.toISOString(),
          updatedAt: exLog.updatedAt.toISOString(),
          setLogs: exLog.setLogs.map((setLog) => ({
            ...setLog,
            createdAt: setLog.createdAt.toISOString(),
            updatedAt: setLog.updatedAt.toISOString(),
          })),
        })),
      })),
    })),
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/dashboard/training">
          <Button variant="ghost">← Volver a Entrenamiento</Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Historial del Mesociclo</h1>
        <p className="mt-2 text-gray-600">{mesocycle.template.title}</p>
        <p className="text-sm text-gray-500">
          {formatDate(mesocycle.startDate)} - {formatDate(mesocycle.endDate)}
        </p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalWorkouts}</div>
              <p className="text-sm text-gray-600 mt-1">Entrenamientos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{totalSets}</div>
              <p className="text-sm text-gray-600 mt-1">Series Totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{totalReps}</div>
              <p className="text-sm text-gray-600 mt-1">Repeticiones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {Math.round(totalVolume).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Volumen (kg)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas de Progresión */}
      <MesocycleHistoryCharts weeklyData={weeklyData} />

      {/* Información del Mesociclo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalles del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Plantilla Base</p>
                <p className="text-gray-900">{mesocycle.template.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Entrenador</p>
                <p className="text-gray-900">{mesocycle.trainer.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Duración</p>
                <p className="text-gray-900">{mesocycle.durationWeeks} semanas</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">RPE Promedio</p>
                <p className="text-gray-900">{avgRPE.toFixed(1)} / 10</p>
              </div>
            </div>

            {mesocycle.trainerNotes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Notas del Entrenador:</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {mesocycle.trainerNotes}
                </p>
              </div>
            )}

            {mesocycle.completedAt && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900">
                  ✓ Mesociclo completado el {formatDate(mesocycle.completedAt)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Semana</CardTitle>
          <CardDescription>
            Progresión semana a semana del mesociclo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mesocycle.microcycles.map((micro) => (
              <div key={micro.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Semana {micro.weekNumber}</h4>
                  <span className="text-sm text-gray-500">
                    {formatDate(micro.startDate)} - {formatDate(micro.endDate)}
                  </span>
                </div>

                {micro.workoutDayLogs.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Entrenamientos:</span>{' '}
                        <span className="font-medium">{micro.workoutDayLogs.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Volumen:</span>{' '}
                        <span className="font-medium">
                          {Math.round(
                            micro.workoutDayLogs.reduce(
                              (sum, log) =>
                                sum +
                                log.exerciseLogs.reduce(
                                  (total, exLog) =>
                                    total +
                                    exLog.setLogs.reduce(
                                      (vol, set) => vol + set.reps * set.weight,
                                      0
                                    ),
                                  0
                                ),
                              0
                            )
                          ).toLocaleString()}{' '}
                          kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">RPE Promedio:</span>{' '}
                        <span className="font-medium">
                          {(
                            micro.workoutDayLogs.reduce(
                              (sum, log) => sum + (log.rpe || 0),
                              0
                            ) / micro.workoutDayLogs.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      {micro.workoutDayLogs.map((log) => (
                        <div key={log.id} className="text-sm text-gray-600 pl-3 border-l-2 border-blue-200">
                          {log.templateDay.name} • {formatDate(log.completedDate)}
                          {log.rpe && ` • RPE: ${log.rpe}`}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Sin entrenamientos registrados</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
