import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ExerciseWorkoutLog from '@/components/ExerciseWorkoutLog'

export default async function TrainingWeekDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  // Obtener la semana con sus sesiones y ejercicios
  const week = await prisma.trainingWeek.findFirst({
    where: {
      id: params.id,
      trainingPlan: {
        userId: session.user.id,
      },
    },
    include: {
      trainingPlan: true,
      sessions: {
        include: {
          exercises: {
            include: {
              sets: {
                orderBy: {
                  setNumber: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          dayNumber: 'asc',
        },
      },
    },
  })

  if (!week) {
    redirect('/dashboard/training')
  }

  // Determinar si esta semana es la actual o futura
  const today = new Date()
  const isCurrentWeek =
    today >= new Date(week.startDate) && today <= new Date(week.endDate)
  const isFutureWeek = today < new Date(week.startDate)

  return (
    <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/training">
          <Button variant="ghost">← Volver al Plan</Button>
        </Link>
      </div>

      {/* Información de la semana */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Semana {week.weekNumber} - {week.trainingPlan.title}
        </h1>
        <p className="mt-2 text-gray-600">
          {new Date(week.startDate).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
          })}{' '}
          -{' '}
          {new Date(week.endDate).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {isFutureWeek && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⏰ Esta semana aún no ha comenzado. Podrás registrar tus entrenamientos cuando llegue
              la fecha de inicio.
            </p>
          </div>
        )}

        {isCurrentWeek && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✅ Esta es tu semana actual. ¡Registra tus entrenamientos a medida que los completes!
            </p>
          </div>
        )}
      </div>

      {/* Sesiones y ejercicios */}
      <div className="space-y-8">
        {week.sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay sesiones programadas
                </h3>
                <p className="text-gray-600">
                  Tu entrenador aún no ha configurado las sesiones para esta semana.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          week.sessions.map((session) => (
            <div key={session.id}>
              {/* Título de la sesión */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Día {session.dayNumber}: {session.name}
                </h2>
                {session.description && (
                  <p className="text-gray-600 mt-1">{session.description}</p>
                )}
              </div>

              {/* Ejercicios de la sesión */}
              <div className="space-y-6">
                {session.exercises.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-600 py-6">
                        No hay ejercicios configurados para esta sesión.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  session.exercises.map((exercise) => (
                    <ExerciseWorkoutLog
                      key={exercise.id}
                      exercise={exercise}
                      currentWeekNumber={week.weekNumber}
                    />
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notas del entrenador */}
      {week.trainingPlan.trainerNotes && (
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💬 Notas del Entrenador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 whitespace-pre-wrap">{week.trainingPlan.trainerNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
