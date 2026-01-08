import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function TrainingPage() {
  // Datos de ejemplo sin base de datos
  const trainingPlans: any[] = []
  const activePlan = null

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan de Entrenamiento</h1>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-xl font-semibold mb-2">
            No tienes un plan de entrenamiento activo
          </h3>
          <p className="text-gray-600 mb-4">
            En modo demo sin base de datos configurada
          </p>
          <p className="text-sm text-gray-500">
            Configura la base de datos para ver tus planes de entrenamiento
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
