
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, formatWeight } from '@/lib/utils'
import ClientProgressCharts from '@/components/ClientProgressCharts'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  const client = await prisma.user.findFirst({
    where: {
      id: params.id,
      trainerId: session!.user.id,
    },
    include: {
      nutritionPlan: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      trainingPlan: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          weeks: true,
        },
      },
      workoutSessions: {
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: {
          session: {
            include: {
              week: true,
            },
          },
        },
      },
      weightEntry: {
        orderBy: { date: 'desc' },
        take: 20,
      },
      files: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!client) {
    notFound()
  }

  const activeNutrition = client.nutritionPlan.find((p) => p.isActive)
  const activeTraining = client.trainingPlan.find((p) => p.isActive)

  // Preparar datos para gráfico de peso
  const weightData = client.weightEntry
    .slice()
    .reverse()
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      weight: entry.weight,
    }))

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/clients">← Volver a Clientes</Link>
        </Button>
      </div>

      {/* Header del cliente */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{client.name}</CardTitle>
              <p className="text-gray-600 mt-2">{client.email}</p>
            </div>
            <div className="flex gap-4">
              {activeNutrition && (
                <div className="text-center">
                  <span className="text-3xl">🥗</span>
                  <p className="text-xs text-gray-600 mt-1">Plan Nutricional</p>
                </div>
              )}
              {activeTraining && (
                <div className="text-center">
                  <span className="text-3xl">💪</span>
                  <p className="text-xs text-gray-600 mt-1">Plan de Entrenamiento</p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {client.workoutSessions.length}
              </div>
              <p className="text-sm text-gray-600">Entrenamientos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {client.weightEntry.length}
              </div>
              <p className="text-sm text-gray-600">Registros de Peso</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {client.files.length}
              </div>
              <p className="text-sm text-gray-600">Archivos</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {client.weightEntry.length > 0
                  ? formatWeight(client.weightEntry[0].weight)
                  : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Peso Actual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Plan Nutricional Activo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plan Nutricional</CardTitle>
              <Link href="/admin/nutrition-plans/new">
                <Button size="sm">Subir Nuevo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeNutrition ? (
              <div>
                <h3 className="font-semibold mb-2">{activeNutrition.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Inicio: {formatDate(activeNutrition.startDate)}
                </p>
                <a
                  href={activeNutrition.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    Ver PDF
                  </Button>
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tiene plan nutricional activo</p>
            )}
          </CardContent>
        </Card>

        {/* Plan de Entrenamiento Activo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plan de Entrenamiento</CardTitle>
              <Link href="/admin/training-plans/new">
                <Button size="sm">Crear Nuevo</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTraining ? (
              <div>
                <h3 className="font-semibold mb-2">{activeTraining.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {activeTraining.weeks.length} semanas • Inicio: {formatDate(activeTraining.startDate)}
                </p>
                <Link href={`/admin/training-plans/${activeTraining.id}`}>
                  <Button variant="outline" size="sm">
                    Ver Detalle
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tiene plan de entrenamiento activo</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Peso */}
      <ClientProgressCharts weightData={weightData} />

      {/* Últimos Entrenamientos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Últimos Entrenamientos</CardTitle>
        </CardHeader>
        <CardContent>
          {client.workoutSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay entrenamientos registrados</p>
          ) : (
            <div className="space-y-3">
              {client.workoutSessions.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{workout.session.name}</h4>
                    <p className="text-sm text-gray-600">
                      Semana {workout.session.week.weekNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatDate(workout.completedAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {workout.emotionalState}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archivos y Fotos */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {client.files.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay archivos subidos</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {client.files.slice(0, 8).map((file) => (
                <div key={file.id} className="border rounded-lg overflow-hidden">
                  {file.type === 'IMAGE' ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl">
                        {file.type === 'PDF' ? '📄' : '📎'}
                      </span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
