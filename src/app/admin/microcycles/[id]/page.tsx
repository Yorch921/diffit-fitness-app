import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function MicrocycleDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TRAINER') {
    redirect('/login')
  }

  const microcycle = await prisma.microcycle.findFirst({
    where: {
      id: params.id,
      mesocycle: {
        trainerId: session.user.id,
      },
    },
    include: {
      mesocycle: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          template: {
            include: {
              days: {
                orderBy: { order: 'asc' },
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
          clientDays: {
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
      workoutDayLogs: {
        orderBy: { completedDate: 'asc' },
        include: {
          templateDay: {
            select: {
              name: true,
              dayNumber: true,
            },
          },
          exerciseLogs: {
            include: {
              exercise: {
                select: {
                  name: true,
                  description: true,
                  videoUrl: true,
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
  })

  if (!microcycle) {
    notFound()
  }

  // Helpers para acceso seguro a mesociclos (soporta isForked)
  const getMesocycleTitle = (mesocycle: any) =>
    mesocycle.isForked
      ? (mesocycle.title ?? 'Plan personalizado')
      : (mesocycle.template?.title ?? 'Plan sin título')

  const getNumberOfDays = (mesocycle: any) =>
    mesocycle.isForked
      ? (mesocycle.clientDays?.length ?? 0)
      : (mesocycle.template?.numberOfDays ?? 0)

  const totalDays = getNumberOfDays(microcycle.mesocycle)
  const completedDays = microcycle.workoutDayLogs.length
  const progressPercent = Math.round((completedDays / totalDays) * 100)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/admin/clients/${microcycle.mesocycle.client.id}`}>
          <Button variant="ghost">← Volver al Cliente</Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">
            Semana {microcycle.weekNumber} - {microcycle.mesocycle.client.name}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {formatDate(microcycle.startDate)} - {formatDate(microcycle.endDate)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Plan</div>
              <div className="font-semibold">{getMesocycleTitle(microcycle.mesocycle)}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Días Completados</div>
              <div className="font-semibold">{completedDays} / {totalDays}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Progreso</div>
              <div className="font-semibold">{progressPercent}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workout Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Entrenamientos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {microcycle.workoutDayLogs.length === 0 ? (
            <p className="text-gray-500">
              El cliente aún no ha registrado ningún entrenamiento para esta semana
            </p>
          ) : (
            <div className="space-y-6">
              {microcycle.workoutDayLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{log.templateDay.name}</h3>
                      <p className="text-sm text-gray-600">
                        Completado el {formatDate(log.completedDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      {log.durationMinutes && (
                        <p className="text-sm text-gray-600">
                          Duración: {log.durationMinutes} min
                        </p>
                      )}
                      {log.rpe && (
                        <p className="text-sm text-gray-600">
                          RPE: {log.rpe}/10
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Exercise Logs */}
                  <div className="space-y-4">
                    {log.exerciseLogs.map((exerciseLog) => (
                      <div key={exerciseLog.id} className="pl-4 border-l-2 border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {exerciseLog.exercise.name}
                        </h4>
                        <div className="space-y-1">
                          {exerciseLog.setLogs.map((setLog) => (
                            <div key={setLog.id} className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600 w-16">
                                Serie {setLog.setNumber}:
                              </span>
                              <span className="font-medium">
                                {setLog.reps} reps × {setLog.weight ? `${setLog.weight}kg` : 'peso corporal'}
                              </span>
                              {setLog.rir !== null && (
                                <span className="text-gray-500">RIR: {setLog.rir}</span>
                              )}
                              {setLog.notes && (
                                <span className="text-gray-500 italic">&ldquo;{setLog.notes}&rdquo;</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Client Notes */}
                  {log.clientNotes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Notas del Cliente:
                      </p>
                      <p className="text-sm text-gray-600">{log.clientNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
