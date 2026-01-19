'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import SortableDayList from '@/components/SortableDayList'

interface TemplateEditorProps {
  template: any
  hideHeader?: boolean
  mesocycleId?: string    // Si se proporciona, estamos editando un plan de cliente
  clientName?: string     // Nombre del cliente
  isForked?: boolean      // true = plan desvinculado, usa clientDays
  clientDays?: any[]      // Días propios del cliente cuando isForked = true
}

export default function TemplateEditor({
  template,
  hideHeader = false,
  mesocycleId,
  clientName,
  isForked = false,
  clientDays = [],
}: TemplateEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [forking, setForking] = useState(false)  // Estado de bloqueo durante fork
  const [error, setError] = useState('')
  const [editingBasicInfo, setEditingBasicInfo] = useState(false)
  const [addingDay, setAddingDay] = useState(false)
  const [addingExercise, setAddingExercise] = useState<string | null>(null)

  // Estados para modal de confirmación de fork
  const [showForkModal, setShowForkModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'addDay' | 'addExercise' | 'updateDay' | 'updateExercise' | 'deleteDay' | 'deleteExercise' | 'updateBasicInfo'
    params: any
  } | null>(null)

  // Edit states
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)

  // FUENTE ÚNICA DE VERDAD: días según isForked
  const days = isForked ? clientDays : (template?.days || [])
  const [localDays, setLocalDays] = useState(days)

  // Sincronizar estado local cuando las props cambian (después de router.refresh())
  useEffect(() => {
    setLocalDays(days)
  }, [days])

  // Determinar si es un plan de cliente (no una plantilla directa)
  const isClientPlan = !!mesocycleId

  // =========================================================================
  // FORK-ON-WRITE: Ejecutar fork atómico antes de la primera edición
  // =========================================================================
  const executeFork = async (): Promise<boolean> => {
    if (!mesocycleId || isForked) {
      return true // Ya está forked o no es plan de cliente
    }

    setForking(true)
    setError('')

    try {
      const response = await fetch('/api/admin/mesocycles/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesocycleId }),
      })

      if (response.ok) {
        // Fork exitoso - actualizar UI sin reload completo
        router.refresh()
        setForking(false)
        return true
      } else {
        const data = await response.json()
        setError(data.error || 'Error al desvincular el plan')
        setForking(false)
        return false
      }
    } catch (error) {
      console.error('Error during fork:', error)
      setError('Error al desvincular el plan')
      setForking(false)
      return false
    }
  }

  // =========================================================================
  // HANDLER DE CONFIRMACIÓN DE FORK
  // =========================================================================
  const handleConfirmFork = async () => {
    if (!pendingAction) return

    setShowForkModal(false)

    // Ejecutar fork primero
    const forked = await executeFork()
    if (!forked) {
      setPendingAction(null)
      return
    }

    // Ejecutar la acción pendiente usando las APIs de cliente (forked)
    // IMPORTANTE: No esperamos a router.refresh() ni a nuevas props
    // Usamos estado local y llamamos directamente con useForkedApi=true
    switch (pendingAction.type) {
      case 'updateExercise':
        await executeUpdateExercise(pendingAction.params.exerciseId, true)
        break
      case 'addDay':
        await executeAddDay(true)
        break
      case 'addExercise':
        await executeAddExercise(pendingAction.params.dayId, true)
        break
      case 'updateDay':
        await executeUpdateDay(pendingAction.params.dayId, true)
        break
      case 'deleteDay':
        await executeDeleteDay(pendingAction.params.dayId, true)
        break
      case 'deleteExercise':
        await executeDeleteExercise(pendingAction.params.exerciseId, true)
        break
      case 'updateBasicInfo':
        await executeUpdateBasicInfo()
        break
    }

    setPendingAction(null)
  }

  // =========================================================================
  // Handlers que verifican fork antes de editar
  // =========================================================================

  const [basicInfo, setBasicInfo] = useState({
    title: template?.title || '',
    description: template?.description || '',
    trainerNotes: template?.trainerNotes || '',
  })

  const [newDay, setNewDay] = useState({
    dayNumber: days.length + 1,
    name: '',
    description: '',
  })

  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    videoUrl: '',
    trainerComment: '',
    sets: [{ setNumber: 1, minReps: 8, maxReps: 12, restSeconds: 90 }],
  })

  const [editDayForm, setEditDayForm] = useState({
    name: '',
    description: '',
  })

  const [editExerciseForm, setEditExerciseForm] = useState({
    name: '',
    description: '',
    videoUrl: '',
    trainerComment: '',
    sets: [{ setNumber: 1, minReps: 8, maxReps: 12, restSeconds: 90 }],
  })

  // =========================================================================
  // HANDLERS - Con fork-on-write para planes de cliente
  // =========================================================================

  // Extraer lógica de ejecución de actualizar información básica
  const executeUpdateBasicInfo = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/training-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicInfo),
      })

      if (response.ok) {
        setEditingBasicInfo(false)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar')
      }
    } catch (error) {
      setError('Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBasicInfo = async () => {
    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'updateBasicInfo',
        params: {}
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeUpdateBasicInfo()
  }

  // Extraer lógica de ejecución de agregar día
  const executeAddDay = async (useForkedApi: boolean = isForked) => {
    setError('')
    setLoading(true)

    try {
      // Usar API correcta según si está forked o no
      const url = useForkedApi
        ? `/api/admin/mesocycles/${mesocycleId}/client-days/add`
        : `/api/admin/training-templates/${template.id}/days`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDay,
          order: newDay.dayNumber,
        }),
      })

      if (response.ok) {
        setAddingDay(false)
        setNewDay({
          dayNumber: days.length + 2,
          name: '',
          description: '',
        })
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al agregar día')
      }
    } catch (error) {
      setError('Error al agregar día')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDay = async () => {
    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'addDay',
        params: {}
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeAddDay()
  }

  // Extraer lógica de ejecución de agregar ejercicio
  const executeAddExercise = async (dayId: string, useForkedApi: boolean = isForked) => {
    setError('')
    setLoading(true)

    try {
      // Usar API correcta según si está forked
      const url = useForkedApi
        ? `/api/admin/client-days/${dayId}/exercises`
        : `/api/admin/training-templates/${template.id}/days/${dayId}/exercises`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExercise),
      })

      if (response.ok) {
        setAddingExercise(null)
        setNewExercise({
          name: '',
          description: '',
          videoUrl: '',
          trainerComment: '',
          sets: [{ setNumber: 1, minReps: 8, maxReps: 12, restSeconds: 90 }],
        })
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al agregar ejercicio')
      }
    } catch (error) {
      setError('Error al agregar ejercicio')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExercise = async (dayId: string) => {
    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'addExercise',
        params: { dayId }
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeAddExercise(dayId)
  }

  // Extraer lógica de ejecución de eliminar ejercicio
  const executeDeleteExercise = async (exerciseId: string, useForkedApi: boolean = isForked) => {
    try {
      // Usar API correcta según si está forked
      const url = useForkedApi
        ? `/api/admin/client-exercises/${exerciseId}`
        : `/api/admin/exercises/${exerciseId}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar')
      }
    } catch (error) {
      alert('Error al eliminar ejercicio')
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este ejercicio?')) return

    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'deleteExercise',
        params: { exerciseId }
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeDeleteExercise(exerciseId)
  }

  // Extraer lógica de ejecución de actualizar día
  const executeUpdateDay = async (dayId: string, useForkedApi: boolean = isForked) => {
    setError('')
    setLoading(true)

    try {
      // Usar API correcta según si está forked
      const url = useForkedApi
        ? `/api/admin/client-days/${dayId}`
        : `/api/admin/training-templates/${template.id}/days/${dayId}`

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDayForm.name,
          description: editDayForm.description,
        }),
      })

      if (response.ok) {
        setEditingDay(null)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar día')
      }
    } catch (error) {
      setError('Error al actualizar día')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDay = async (dayId: string) => {
    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'updateDay',
        params: { dayId }
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeUpdateDay(dayId)
  }

  // Extraer lógica de ejecución de eliminar día
  const executeDeleteDay = async (dayId: string, useForkedApi: boolean = isForked) => {
    try {
      // Usar API correcta según si está forked
      const url = useForkedApi
        ? `/api/admin/client-days/${dayId}`
        : `/api/admin/training-templates/${template.id}/days/${dayId}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar día')
      }
    } catch (error) {
      alert('Error al eliminar día')
    }
  }

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este día? Se eliminarán todos sus ejercicios.')) return

    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'deleteDay',
        params: { dayId }
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeDeleteDay(dayId)
  }

  // Extraer lógica de ejecución de actualizar ejercicio
  const executeUpdateExercise = async (exerciseId: string, useForkedApi: boolean = isForked) => {
    setError('')
    setLoading(true)

    try {
      // Usar API correcta según si está forked
      const url = useForkedApi
        ? `/api/admin/client-exercises/${exerciseId}`
        : `/api/admin/exercises/${exerciseId}`

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editExerciseForm.name,
          description: editExerciseForm.description,
          videoUrl: editExerciseForm.videoUrl,
          trainerComment: editExerciseForm.trainerComment,
          sets: editExerciseForm.sets,
        }),
      })

      if (response.ok) {
        setEditingExercise(null)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar ejercicio')
      }
    } catch (error) {
      setError('Error al actualizar ejercicio')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateExercise = async (exerciseId: string) => {
    // Para planes de cliente no forked, mostrar modal de confirmación
    if (isClientPlan && !isForked) {
      setPendingAction({
        type: 'updateExercise',
        params: { exerciseId }
      })
      setShowForkModal(true)
      return
    }

    // Si ya está forked, ejecutar normalmente
    await executeUpdateExercise(exerciseId)
  }

  const addSetToNewExercise = () => {
    setNewExercise({
      ...newExercise,
      sets: [
        ...newExercise.sets,
        {
          setNumber: newExercise.sets.length + 1,
          minReps: 8,
          maxReps: 12,
          restSeconds: 90,
        },
      ],
    })
  }

  const addSetToEditExercise = () => {
    setEditExerciseForm({
      ...editExerciseForm,
      sets: [
        ...editExerciseForm.sets,
        {
          setNumber: editExerciseForm.sets.length + 1,
          minReps: 8,
          maxReps: 12,
          restSeconds: 90,
        },
      ],
    })
  }

  const removeSetFromEditExercise = (index: number) => {
    if (editExerciseForm.sets.length <= 1) {
      alert('Debe haber al menos una serie')
      return
    }
    const updatedSets = editExerciseForm.sets.filter((_, i) => i !== index)
    const renumbered = updatedSets.map((set, idx) => ({
      ...set,
      setNumber: idx + 1,
    }))
    setEditExerciseForm({ ...editExerciseForm, sets: renumbered })
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  // Mostrar overlay de bloqueo durante fork
  if (forking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900">Desvinculando plan...</h3>
          <p className="text-sm text-gray-600 mt-2">
            Se está creando una copia personalizada del plan para este cliente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modal de Confirmación de Fork */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirmar Personalización del Plan
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Este plan está vinculado a una plantilla. Al realizar cambios se creará
              una copia personalizada para <strong>{clientName}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Los cambios futuros solo afectarán a este cliente. ¿Deseas continuar?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForkModal(false)
                  setPendingAction(null)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmFork}>
                Confirmar y Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-6 sm:px-0">
      {!hideHeader && (
        <>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href="/admin/training-templates" className="text-blue-600 hover:underline text-sm mb-2 block">
                ← Volver a Plantillas
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{template?.title}</h1>
              <p className="mt-2 text-gray-600">
                {template?.numberOfDays} días por semana • {days.length} días configurados
              </p>
            </div>
          </div>

          {/* Active Mesocycles Warning - solo para plantillas */}
          {template?.mesocycles && template.mesocycles.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Atención:</strong> Esta plantilla está asignada a {template.mesocycles.length} cliente(s).
                Los cambios afectarán solo a clientes que NO hayan personalizado su plan.
              </p>
              <div className="mt-2 space-y-1">
                {template.mesocycles.map((m: any) => (
                  <p key={m.id} className="text-xs text-yellow-800">
                    • {m.client.name} ({m.client.email})
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Indicador de estado para plan de cliente */}
      {isClientPlan && !isForked && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Plan vinculado a plantilla:</strong> Al realizar cambios, se creará automáticamente
            una copia personalizada para {clientName || 'este cliente'}.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Info Card - solo para plantillas directas */}
      {!isClientPlan && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Información Básica</CardTitle>
              {!editingBasicInfo && (
                <Button variant="outline" size="sm" onClick={() => setEditingBasicInfo(true)}>
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingBasicInfo ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Nombre</Label>
                  <Input
                    id="title"
                    value={basicInfo.title}
                    onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="trainerNotes">Notas del Entrenador</Label>
                  <Textarea
                    id="trainerNotes"
                    value={basicInfo.trainerNotes}
                    onChange={(e) => setBasicInfo({ ...basicInfo, trainerNotes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingBasicInfo(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateBasicInfo} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{template?.description || 'Sin descripción'}</p>
                {template?.trainerNotes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-xs font-medium text-gray-700">Notas:</p>
                    <p className="text-sm text-gray-600">{template.trainerNotes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Days Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Días de la Semana</h2>
          <Button onClick={() => setAddingDay(true)}>
            + Agregar Día
          </Button>
        </div>

        {/* Add Day Form */}
        {addingDay && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle>Nuevo Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Número de Día</Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={newDay.dayNumber}
                    onChange={(e) => setNewDay({ ...newDay, dayNumber: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Nombre del Día *</Label>
                  <Input
                    value={newDay.name}
                    onChange={(e) => setNewDay({ ...newDay, name: e.target.value })}
                    placeholder="Ej: Día 1 - Pecho y Tríceps"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={newDay.description}
                    onChange={(e) => setNewDay({ ...newDay, description: e.target.value })}
                    placeholder="Descripción del enfoque del día..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAddingDay(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDay} disabled={loading || !newDay.name}>
                    {loading ? 'Agregando...' : 'Agregar Día'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Days List with Drag & Drop */}
        <SortableDayList
          days={localDays}
          templateId={template?.id}
          editingDay={editingDay}
          editDayForm={editDayForm}
          loading={loading}
          addingExercise={addingExercise}
          editingExercise={editingExercise}
          editExerciseForm={editExerciseForm}
          newExercise={newExercise}
          onEditDay={(day) => {
            setEditDayForm({
              name: day.name,
              description: day.description || '',
            })
            setEditingDay(day.id)
          }}
          onUpdateDay={handleUpdateDay}
          onCancelEditDay={() => setEditingDay(null)}
          onDeleteDay={handleDeleteDay}
          onAddExercise={(dayId) => setAddingExercise(dayId)}
          onCancelAddExercise={() => setAddingExercise(null)}
          onSubmitAddExercise={handleAddExercise}
          onEditExercise={(exercise) => {
            setEditExerciseForm({
              name: exercise.name,
              description: exercise.description || '',
              videoUrl: exercise.videoUrl || '',
              trainerComment: exercise.trainerComment || '',
              sets: exercise.sets.map((s: any) => ({
                setNumber: s.setNumber,
                minReps: s.minReps,
                maxReps: s.maxReps,
                restSeconds: s.restSeconds || 90,
              })),
            })
            setEditingExercise(exercise.id)
          }}
          onUpdateExercise={handleUpdateExercise}
          onCancelEditExercise={() => setEditingExercise(null)}
          onDeleteExercise={handleDeleteExercise}
          onReorder={setLocalDays}
          setEditDayForm={setEditDayForm}
          setNewExercise={setNewExercise}
          setEditExerciseForm={setEditExerciseForm}
          addSetToNewExercise={addSetToNewExercise}
          addSetToEditExercise={addSetToEditExercise}
          removeSetFromEditExercise={removeSetFromEditExercise}
        />
      </div>
    </div>
    </>
  )
}
