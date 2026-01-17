'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

type ClientStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

interface Client {
  id: string
  name: string
  email: string
  image: string | null
  status: ClientStatus
  createdAt: Date
  trainer?: {
    id: string
    name: string
    specialty: string | null
  } | null
  nutritionPlan: Array<{ id: string; title: string }>
  weightEntry: Array<{ date: Date; weight: number }>
  _count: {
    nutritionPlan: number
    clientMesocycles: number
    weightEntry: number
  }
}

interface ClientsTableProps {
  clients: Client[]
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClientStatus>('ALL')
  const [planFilter, setPlanFilter] = useState<'ALL' | 'NUTRITION' | 'TRAINING' | 'BOTH' | 'NONE'>('ALL')
  const [ageFilter, setAgeFilter] = useState<'ALL' | 'NEW' | 'OLD'>('ALL')
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Calcular última actividad
  const getLastActivity = (client: Client) => {
    const lastWeight = client.weightEntry[0]?.date
    return lastWeight || null
  }

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter

      // Filtro por plan
      const hasNutritionPlan = client.nutritionPlan.length > 0
      const hasTrainingPlan = client._count.clientMesocycles > 0
      let matchesPlan = true
      if (planFilter === 'NUTRITION') matchesPlan = hasNutritionPlan && !hasTrainingPlan
      if (planFilter === 'TRAINING') matchesPlan = hasTrainingPlan && !hasNutritionPlan
      if (planFilter === 'BOTH') matchesPlan = hasNutritionPlan && hasTrainingPlan
      if (planFilter === 'NONE') matchesPlan = !hasNutritionPlan && !hasTrainingPlan

      // Filtro por antigüedad (último mes = nuevo, más de 1 mes = antiguo)
      const createdDate = new Date(client.createdAt)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      let matchesAge = true
      if (ageFilter === 'NEW') matchesAge = createdDate >= oneMonthAgo
      if (ageFilter === 'OLD') matchesAge = createdDate < oneMonthAgo

      // Filtro por última actividad (últimos 7 días = activo)
      const lastActivity = getLastActivity(client)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      let matchesActivity = true
      if (activityFilter === 'ACTIVE') matchesActivity = lastActivity ? new Date(lastActivity) >= sevenDaysAgo : false
      if (activityFilter === 'INACTIVE') matchesActivity = !lastActivity || new Date(lastActivity) < sevenDaysAgo

      return matchesSearch && matchesStatus && matchesPlan && matchesAge && matchesActivity
    })
  }, [clients, searchTerm, statusFilter, planFilter, ageFilter, activityFilter])

  // Obtener badge de estado
  const getStatusBadge = (status: ClientStatus) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    }

    const labels = {
      ACTIVE: 'Activo',
      PAUSED: 'Pausado',
      ARCHIVED: 'Archivado',
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-2 text-gray-600">Administra tus clientes y sus planes</p>
        </div>
        <Link href="/admin/clients/new">
          <Button>+ Añadir Cliente</Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Fila de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de estado */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Estado</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="PAUSED">Pausados</option>
                  <option value="ARCHIVED">Archivados</option>
                </select>
              </div>

              {/* Filtro de plan */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Plan</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                >
                  <option value="ALL">Todos</option>
                  <option value="BOTH">Nutrición + Entrenamiento</option>
                  <option value="NUTRITION">Solo Nutrición</option>
                  <option value="TRAINING">Solo Entrenamiento</option>
                  <option value="NONE">Sin planes</option>
                </select>
              </div>

              {/* Filtro de antigüedad */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Antigüedad</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value as any)}
                >
                  <option value="ALL">Todos</option>
                  <option value="NEW">Nuevos (último mes)</option>
                  <option value="OLD">Antiguos (+1 mes)</option>
                </select>
              </div>

              {/* Filtro de actividad */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Última Actividad</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as any)}
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos (últimos 7 días)</option>
                  <option value="INACTIVE">Inactivos (+7 días)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredClients.length} de {clients.length} clientes
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">
              {clients.length === 0
                ? 'No tienes clientes asignados'
                : 'No se encontraron clientes'}
            </h3>
            <p className="text-gray-600 mb-4">
              {clients.length === 0
                ? 'Añade tu primer cliente para comenzar'
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
            {clients.length === 0 && (
              <Link href="/admin/clients/new">
                <Button>Añadir Primer Cliente</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrenador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Actividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const lastActivity = getLastActivity(client)
                    const hasNutritionPlan = client.nutritionPlan.length > 0
                    const hasTrainingPlan = client._count.clientMesocycles > 0

                    return (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            {/* Foto de perfil */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {client.image ? (
                                <img
                                  src={client.image}
                                  alt={client.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">{client.name[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.name}
                              </div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {client.trainer?.name || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(client.createdAt.toISOString())}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                          {lastActivity ? formatDate(lastActivity.toISOString()) : '—'}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex gap-2 text-sm">
                            {hasNutritionPlan && (
                              <span className="text-green-600" title="Plan nutricional activo">
                                🥗
                              </span>
                            )}
                            {hasTrainingPlan && (
                              <span className="text-blue-600" title="Plan de entrenamiento activo">
                                💪
                              </span>
                            )}
                            {!hasNutritionPlan && !hasTrainingPlan && (
                              <span className="text-gray-400">Sin planes</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
