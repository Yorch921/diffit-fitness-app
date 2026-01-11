import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function MicrocycleDetailPage({
  params,
}: {
  params: { weekNumber: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  const weekNumber = parseInt(params.weekNumber)

  // Obtener mesociclo activo
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
      microcycles: {
        where: { weekNumber },
        include: {
          workoutDayLogs: {
            include: {
              templateDay: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!activeMesocycle || !activeMesocycle.microcycles[0]) {
    notFound()
  }

  const microcycle = activeMesocycle.microcycles[0]
  const isFutureWeek = new Date() < new Date(microcycle.startDate)

  // Verificar qué días ya están registrados
  const loggedDayIds = new Set(microcycle.workoutDayLogs.map((log) => log.templateDay.id))

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/dashboard/training">
          <Button variant="ghost">← Volver a Mi Plan</Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Semana {weekNumber} - {activeMesocycle.template.title}
        </h1>
        <p className="mt-2 text-gray-600">
          {formatDate(microcycle.startDate)} - {formatDate(microcycle.endDate)}
        </p>
        {isFutureWeek && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              ⚠️ Esta semana aún no ha comenzado. No puedes registrar entrenamientos futuros.
            </p>
          </div>
        )}
      </div>

      {/* Resumen del Microciclo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Progreso de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {microcycle.workoutDayLogs.length}
              </div>
              <p className="text-sm text-gray-600">Días Completados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {activeMesocycle.template.days.length - microcycle.workoutDayLogs.length}
              </div>
              <p className="text-sm text-gray-600">Días Pendientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Días de la Semana */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Selecciona el Día a Registrar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMesocycle.template.days.map((day) => {
            const isLogged = loggedDayIds.has(day.id)
            const dayLog = microcycle.workoutDayLogs.find((log) => log.templateDay.id === day.id)

            return (
              <Card
                key={day.id}
                className={`transition-all ${
                  isLogged
                    ? 'border-green-500 bg-green-50'
                    : isFutureWeek
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:shadow-lg hover:border-blue-500'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{day.name}</CardTitle>
                    {isLogged && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        ✓ Completado
                      </span>
                    )}
                  </div>
                  {day.description && <CardDescription>{day.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      {day.exercises.length} ejercicios
                    </p>
                    <div className="space-y-1">
                      {day.exercises.slice(0, 3).map((exercise, idx) => (
                        <p key={exercise.id} className="text-sm text-gray-600">
                          {idx + 1}. {exercise.name}
                        </p>
                      ))}
                      {day.exercises.length > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          +{day.exercises.length - 3} más...
                        </p>
                      )}
                    </div>
                  </div>

                  {isLogged ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Registrado el {formatDate(dayLog!.completedDate)}
                      </p>
                      <Link
                        href={`/dashboard/training/log/day?microcycleId=${microcycle.id}&dayId=${day.id}&edit=${dayLog!.id}`}
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          Ver / Editar Registro
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/training/log/day?microcycleId=${microcycle.id}&dayId=${day.id}`}
                    >
                      <Button className="w-full" disabled={isFutureWeek}>
                        Registrar Entrenamiento
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
