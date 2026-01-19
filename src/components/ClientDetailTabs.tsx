'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatWeight } from '@/lib/utils'
import ClientProgressCharts from '@/components/ClientProgressCharts'
import MesocycleAssignModal from '@/components/MesocycleAssignModal'
import TrainingProgressTab from '@/components/TrainingProgressTab'

type TabType = 'general' | 'nutrition' | 'training' | 'progress'

interface ClientDetailTabsProps {
  client: any
}

// Helpers para acceso seguro a mesociclos (soporta isForked)
const getMesocycleTitle = (mesocycle: any) =>
  mesocycle.isForked
    ? (mesocycle.title ?? 'Plan personalizado')
    : (mesocycle.template?.title ?? 'Plan sin título')

const getNumberOfDays = (mesocycle: any) =>
  mesocycle.isForked
    ? (mesocycle.clientDays?.length ?? 0)
    : (mesocycle.template?.numberOfDays ?? 0)

export default function ClientDetailTabs({ client }: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; title: string } | null>(null)
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email,
    age: client.age || '',
    gender: client.gender || 'MALE',
    height: client.height || '',
    initialWeight: client.initialWeight || '',
    goal: client.goal || '',
    clinicalNotes: client.clinicalNotes || '',
    nextReviewDate: client.nextReviewDate ? client.nextReviewDate.split('T')[0] : '',
  })

  const activeNutrition = client.nutritionPlan.find((p: any) => p.isActive)
  const activeTraining = client.clientMesocycles.find((m: any) => m.isActive)
  const previousNutrition = client.nutritionPlan.filter((p: any) => !p.isActive)
  const previousTraining = client.clientMesocycles.filter((m: any) => !m.isActive && m.isCompleted)

  const weightData = client.weightEntry
    .slice()
    .reverse()
    .map((entry: any) => ({
      date: new Date(entry.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      weight: entry.weight,
    }))

  const handleSaveGeneral = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          height: formData.height ? parseFloat(formData.height) : null,
          initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : null,
          goal: formData.goal || null,
          clinicalNotes: formData.clinicalNotes || null,
          nextReviewDate: formData.nextReviewDate ? new Date(formData.nextReviewDate).toISOString() : null,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        window.location.reload()
      } else {
        alert('Error al guardar cambios')
      }
    } catch (error) {
      alert('Error al guardar cambios')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Datos Generales', icon: '📋' },
    { id: 'nutrition', label: 'Nutrición', icon: '🥗' },
    { id: 'training', label: 'Entrenamiento', icon: '💪' },
    { id: 'progress', label: 'Progreso', icon: '📈' },
  ]

  const getStatusBadge = (status: string) => {
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
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link href="/admin/clients">
          <Button variant="ghost">← Volver a Clientes</Button>
        </Link>
      </div>

      {/* Header del cliente */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{client.name}</CardTitle>
              <p className="text-gray-600 mt-2">{client.email}</p>
              <div className="mt-2">{getStatusBadge(client.status)}</div>
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
                {client.clientMesocycles.reduce(
                  (acc: number, m: any) =>
                    acc +
                    m.microcycles.reduce(
                      (sum: number, micro: any) => sum + (micro._count?.workoutDayLogs || 0),
                      0
                    ),
                  0
                )}
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
                {client.clientMesocycles.length}
              </div>
              <p className="text-sm text-gray-600">Mesociclos</p>
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

      {/* Tabs Navigation */}
      <div className="border-b mb-6">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Datos Generales</CardTitle>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Datos de Cuenta */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Datos de Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{client.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{client.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos Personales */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Datos Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Edad</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{client.age || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    {isEditing ? (
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                        <option value="OTHER">Otro</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {client.gender === 'MALE'
                          ? 'Masculino'
                          : client.gender === 'FEMALE'
                          ? 'Femenino'
                          : client.gender === 'OTHER'
                          ? 'Otro'
                          : '—'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{client.height ? `${client.height} cm` : '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Inicial (kg)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.initialWeight}
                        onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {client.initialWeight ? `${client.initialWeight} kg` : '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Objetivo y Observaciones */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Objetivo y Observaciones</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    {isEditing ? (
                      <textarea
                        value={formData.goal}
                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">{client.goal || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Observaciones Clínicas</Label>
                    {isEditing ? (
                      <textarea
                        value={formData.clinicalNotes}
                        onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                        className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">{client.clinicalNotes || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Próxima Revisión</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.nextReviewDate}
                        onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {client.nextReviewDate ? formatDate(client.nextReviewDate) : '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleSaveGeneral} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          {/* Plan Activo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan Nutricional Actual</CardTitle>
                <Link href="/admin/nutrition-plans/new">
                  <Button size="sm">+ Asignar Nuevo Plan</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {activeNutrition ? (
                <div>
                  <h3 className="text-xl font-semibold mb-2">{activeNutrition.title}</h3>
                  {activeNutrition.description && (
                    <p className="text-gray-600 mb-3">{activeNutrition.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {activeNutrition.calories && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{activeNutrition.calories}</div>
                        <div className="text-xs text-gray-600">kcal</div>
                      </div>
                    )}
                    {activeNutrition.protein && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{activeNutrition.protein}g</div>
                        <div className="text-xs text-gray-600">Proteínas</div>
                      </div>
                    )}
                    {activeNutrition.carbs && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{activeNutrition.carbs}g</div>
                        <div className="text-xs text-gray-600">Carbohidratos</div>
                      </div>
                    )}
                    {activeNutrition.fats && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{activeNutrition.fats}g</div>
                        <div className="text-xs text-gray-600">Grasas</div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Inicio: {formatDate(activeNutrition.startDate)}
                  </p>
                  <a href={activeNutrition.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">Ver PDF</Button>
                  </a>
                </div>
              ) : (
                <p className="text-gray-500">No tiene plan nutricional activo</p>
              )}
            </CardContent>
          </Card>

          {/* Historial */}
          {previousNutrition.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Planes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousNutrition.map((plan: any) => (
                    <div key={plan.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{plan.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(plan.startDate)} - {plan.endDate ? formatDate(plan.endDate) : 'Presente'}
                        </p>
                      </div>
                      <a href={plan.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          Ver PDF
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'training' && (
        <div className="space-y-6">
          {/* Plan Activo */}
          <Card>
            <CardHeader>
              <CardTitle>Plan de Entrenamiento Actual</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTraining ? (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>{activeTraining.isForked ? 'Plan Personalizado:' : 'Plantilla Base:'}</strong> {getMesocycleTitle(activeTraining)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{activeTraining.durationWeeks}</div>
                      <div className="text-xs text-gray-600">Semanas Totales</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {getNumberOfDays(activeTraining)}
                      </div>
                      <div className="text-xs text-gray-600">Días/Semana</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {activeTraining.microcycles.length}
                      </div>
                      <div className="text-xs text-gray-600">Microciclos</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Inicio:</strong> {formatDate(activeTraining.startDate)} -{' '}
                    <strong>Fin:</strong> {formatDate(activeTraining.endDate)}
                  </p>
                  {activeTraining.trainerNotes && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notas del Entrenador:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{activeTraining.trainerNotes}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/admin/mesocycles/${activeTraining.id}`}>
                      <Button variant="outline">Ver Plan de Entrenamiento</Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm('¿Deseas desactivar el mesociclo actual y asignar uno nuevo?')) {
                          setShowAssignModal(true)
                        }
                      }}
                    >
                      Cambiar Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">No tiene plan de entrenamiento activo</p>
                  <Button onClick={() => setShowAssignModal(true)}>
                    Asignar Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progreso del Mesociclo Actual */}
          {activeTraining && (() => {
            // Filtrar solo microciclos que tienen al menos 1 workout log (semanas iniciadas)
            const startedWeeks = activeTraining.microcycles.filter(
              (micro: any) => micro._count?.workoutDayLogs > 0
            )

            // Determinar semana activa (la más reciente con logs, o la que está en su rango de fechas)
            const now = new Date()
            const activeWeek = startedWeeks.find((micro: any) => {
              const start = new Date(micro.startDate)
              const end = new Date(micro.endDate)
              return now >= start && now <= end
            }) || startedWeeks[startedWeeks.length - 1] // Si no hay semana en rango, usar la más reciente iniciada

            return startedWeeks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Progreso del Mesociclo Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {startedWeeks.map((micro: any) => {
                      const isActive = activeWeek?.id === micro.id
                      const completedDays = micro._count?.workoutDayLogs || 0
                      const totalDays = getNumberOfDays(activeTraining)
                      const progressPercent = Math.round((completedDays / totalDays) * 100)

                      return (
                        <Link
                          key={micro.id}
                          href={`/admin/microcycles/${micro.id}`}
                          className="block"
                        >
                          <div className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                            isActive ? 'border-blue-500 bg-blue-50' : ''
                          }`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">Semana {micro.weekNumber}</h4>
                                {isActive && (
                                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                    Activa
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatDate(micro.startDate)} - {formatDate(micro.endDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {completedDays} / {totalDays} días
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${isActive ? 'bg-blue-500' : 'bg-green-500'}`}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 min-w-[3ch]">
                                  {progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  {startedWeeks.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      El cliente aún no ha iniciado ninguna semana de entrenamiento
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null
          })()}

          {/* Historial de Mesociclos */}
          {previousTraining.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Mesociclos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousTraining.map((meso: any) => (
                    <div key={meso.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{getMesocycleTitle(meso)}</h4>
                          <p className="text-sm text-gray-600">
                            {meso.durationWeeks} semanas • {formatDate(meso.startDate)} - {formatDate(meso.endDate)}
                          </p>
                        </div>
                        {meso.completedAt && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Completado
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total de microciclos: {meso.microcycles.length}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Asignación de Mesociclo */}
      {showAssignModal && (
        <MesocycleAssignModal
          templateId=""
          templateTitle="Selecciona plantilla"
          clientId={client.id}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false)
            window.location.reload()
          }}
        />
      )}

      {activeTab === 'progress' && (
        <TrainingProgressTab clientId={client.id} />
      )}
    </div>
  )
}
