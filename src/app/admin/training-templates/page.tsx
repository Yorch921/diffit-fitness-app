import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TemplateCardActions from '@/components/TemplateCardActions'

export default async function TrainingTemplatesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TRAINER') {
    redirect('/login')
  }

  const templates = await prisma.trainingTemplate.findMany({
    where: {
      trainerId: session.user.id,
      isArchived: false,
    },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: {
          exercises: true,
        },
      },
      mesocycles: {
        where: {
          trainerId: session.user.id,
          isForked: false,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas de Entrenamiento</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tus plantillas reutilizables (semana tipo)
          </p>
        </div>
        <Link href="/admin/training-templates/new">
          <Button>
            + Nueva Plantilla
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">
              No tienes plantillas de entrenamiento
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera plantilla reutilizable para asignar a tus clientes
            </p>
            <Link href="/admin/training-templates/new">
              <Button>
                Crear Primera Plantilla
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const totalExercises = template.days.reduce(
              (acc, day) => acc + day.exercises.length,
              0
            )

            // Contar mesocycles vinculados (ya filtrados por trainerId e isForked=false en la query)
            const linkedMesocyclesCount = template.mesocycles.length

            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.numberOfDays} días por semana
                      </CardDescription>
                    </div>
                    {linkedMesocyclesCount > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {linkedMesocyclesCount} asignado{linkedMesocyclesCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {template.days.length}
                      </div>
                      <p className="text-xs text-gray-600">Días</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {totalExercises}
                      </div>
                      <p className="text-xs text-gray-600">Ejercicios</p>
                    </div>
                  </div>

                  <TemplateCardActions
                    templateId={template.id}
                    templateTitle={template.title}
                    hasAssignments={linkedMesocyclesCount > 0}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
