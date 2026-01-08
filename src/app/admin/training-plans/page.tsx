import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function TrainingPlansPage() {
  const session = await getServerSession(authOptions)

  const trainingPlans = await prisma.trainingPlan.findMany({
    where: {
      user: {
        trainerId: session!.user.id,
      },
    },
    include: {
      user: true,
      weeks: {
        include: {
          sessions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes de Entrenamiento</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los planes de entrenamiento de tus clientes
          </p>
        </div>
        <Link href="/admin/training-plans/new">
          <Button>Crear Plan</Button>
        </Link>
      </div>

      {trainingPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-xl font-semibold mb-2">
              No hay planes de entrenamiento
            </h3>
            <p className="text-gray-600 mb-4">
              Crea el primer plan de entrenamiento para tus clientes
            </p>
            <Link href="/admin/training-plans/new">
              <Button>Crear Primer Plan</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trainingPlans.map((plan) => {
            const totalSessions = plan.weeks.reduce(
              (acc, week) => acc + week.sessions.length,
              0
            )

            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle>{plan.title}</CardTitle>
                        {plan.isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Activo
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        Cliente: {plan.user.name} • {plan.weeks.length} semanas • {totalSessions} sesiones
                      </CardDescription>
                    </div>
                    <Link href={`/admin/training-plans/${plan.id}`}>
                      <Button variant="outline">Ver Detalle</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {plan.description && (
                    <p className="text-gray-600 mb-3">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📅 Inicio: {formatDate(plan.startDate)}</span>
                    {plan.endDate && <span>Fin: {formatDate(plan.endDate)}</span>}
                    <span>🗓️ Creado: {formatDate(plan.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
