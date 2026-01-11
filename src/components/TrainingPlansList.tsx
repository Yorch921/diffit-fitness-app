'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import DuplicatePlanModal from './DuplicatePlanModal'

interface Client {
  id: string
  name: string | null
  email: string
}

interface TrainingPlan {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date | null
  isActive: boolean
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
  weeks: {
    id: string
    sessions: {
      id: string
    }[]
  }[]
}

interface TrainingPlansListProps {
  plans: TrainingPlan[]
  clients: Client[]
  onRefresh: () => void
}

export default function TrainingPlansList({ plans, clients, onRefresh }: TrainingPlansListProps) {
  const [duplicatingPlan, setDuplicatingPlan] = useState<{ id: string; title: string } | null>(null)

  const handleDuplicate = (planId: string, planTitle: string) => {
    setDuplicatingPlan({ id: planId, title: planTitle })
  }

  const handleDuplicateSuccess = () => {
    onRefresh()
  }

  if (plans.length === 0) {
    return (
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
    )
  }

  return (
    <>
      <div className="space-y-4">
        {plans.map((plan) => {
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(plan.id, plan.title)}
                    >
                      Duplicar
                    </Button>
                    <Link href={`/admin/training-plans/${plan.id}`}>
                      <Button variant="outline" size="sm">Ver Detalle</Button>
                    </Link>
                  </div>
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

      {duplicatingPlan && (
        <DuplicatePlanModal
          planId={duplicatingPlan.id}
          planTitle={duplicatingPlan.title}
          clients={clients}
          onClose={() => setDuplicatingPlan(null)}
          onSuccess={handleDuplicateSuccess}
        />
      )}
    </>
  )
}
