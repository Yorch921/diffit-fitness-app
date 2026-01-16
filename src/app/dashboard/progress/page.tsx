import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import TrainingProgressTab from '@/components/TrainingProgressTab'

export default async function ClientProgressPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/login')
  }

  if (session.user.role !== 'CLIENT') {
    redirect('/admin')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mi Progreso</h1>
        <p className="text-gray-600 mt-2">
          Análisis detallado de tu evolución en el entrenamiento
        </p>
      </div>

      <TrainingProgressTab clientId={session.user.id} />
    </div>
  )
}
