'use client'

import { useRouter } from 'next/navigation'
import TrainingPlansList from '@/components/TrainingPlansList'

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

interface TrainingPlansListWrapperProps {
  initialPlans: TrainingPlan[]
  clients: Client[]
}

export default function TrainingPlansListWrapper({ initialPlans, clients }: TrainingPlansListWrapperProps) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <TrainingPlansList
      plans={initialPlans}
      clients={clients}
      onRefresh={handleRefresh}
    />
  )
}
