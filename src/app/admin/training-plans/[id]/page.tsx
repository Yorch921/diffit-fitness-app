import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default async function TrainingPlanDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  const plan = await prisma.trainingPlan.findFirst({
    where: {
      id: params.id,
      user: {
        trainerId: session!.user.id,
      },
    },
    include: {
      user: true,
      weeks: {
        include: {
          sessions: {
            include: {
              exercises: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          weekNumber: 'asc',
        },
      },
    },
  })

  if (!plan) {
    notFound()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/admin/training-plans">
          <Button variant="ghost">← Volver a Planes</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{plan.title}</CardTitle>
              <p className="text-gray-600 mt-2">Cliente: {plan.user.name}</p>
            </div>
            {plan.isActive && (
              <span className="px-3 py-1 bg-green-100 text-green-700 font-medium rounded">
                Activo
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {plan.description && (
            <p className="text-gray-700 mb-4">{plan.description}</p>
          )}
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600">
              📅 Inicio: <strong>{formatDate(plan.startDate)}</strong>
            </span>
            <span className="text-gray-600">
              🗓️ Semanas: <strong>{plan.weeks.length}</strong>
            </span>
            <span className="text-gray-600">
              💪 Sesiones: <strong>{plan.weeks.reduce((acc, w) => acc + w.sessions.length, 0)}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {plan.weeks.map((week) => (
          <Card key={week.id}>
            <CardHeader>
              <CardTitle>Semana {week.weekNumber}</CardTitle>
              <p className="text-sm text-gray-600">
                {formatDate(week.startDate)} - {formatDate(week.endDate)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {week.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{session.name}</h4>
                      <Link href={`/admin/training-plans/${plan.id}/session/${session.id}`}>
                        <Button variant="outline" size="sm">
                          {session.exercises.length === 0
                            ? 'Añadir Ejercicios'
                            : 'Editar Ejercicios'}
                        </Button>
                      </Link>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {session.description}
                      </p>
                    )}
                    {session.exercises.length > 0 ? (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">
                          {session.exercises.length} ejercicios:
                        </span>
                        <span className="ml-2">
                          {session.exercises.map((ex) => ex.name).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No hay ejercicios asignados
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
