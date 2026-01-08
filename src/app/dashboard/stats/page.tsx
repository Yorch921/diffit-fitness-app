import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function StatsPage() {
  // Datos de ejemplo sin base de datos
  const completedSessions: any[] = []
  const weightEntries: any[] = []
  const totalWorkouts = 0
  const workoutsThisMonth = 0
  const weightProgress = 0

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
        <p className="mt-2 text-gray-600">
          Visualiza tu progreso y rendimiento
        </p>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Entrenamientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalWorkouts}</div>
            <p className="text-xs text-gray-500 mt-1">Sesiones completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{workoutsThisMonth}</div>
            <p className="text-xs text-gray-500 mt-1">Entrenamientos este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Progreso de Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {weightProgress > 0 ? '+' : ''}{weightProgress.toFixed(1)} kg
            </div>
            <p className="text-xs text-gray-500 mt-1">Sin registros</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">
            Modo Demo - Sin Datos
          </h3>
          <p className="text-gray-600 mb-4">
            Configura la base de datos para ver tus estadísticas reales
          </p>
          <p className="text-sm text-gray-500">
            Ejecuta: npm run db:generate && npm run db:migrate && npm run db:seed
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
