'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Exercise {
  id: string
  name: string
  description: string | null
  videoUrl: string | null
  order: number
}

interface Session {
  id: string
  name: string
  description: string | null
  exercises: Exercise[]
  lastWorkoutData: Record<string, {
    reps: number
    weight: number
    rir: number
    notes: string | null
  }>
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStartDialog, setShowStartDialog] = useState(true)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [exerciseData, setExerciseData] = useState<Record<string, { reps: string; weight: string; rir: string; notes: string }>>({})
  const [endData, setEndData] = useState({
    emotionalState: 'NORMAL',
    fatigueLevel: '5',
    waterIntake: '2',
    notes: '',
  })

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/training/session/${params.id}`)
      const data = await response.json()
      setSession(data)

      // Inicializar datos de ejercicios con datos previos
      const initialData: Record<string, { reps: string; weight: string; rir: string; notes: string }> = {}
      data.exercises.forEach((ex: Exercise) => {
        const lastData = data.lastWorkoutData[ex.id]
        initialData[ex.id] = {
          reps: lastData?.reps?.toString() || '',
          weight: lastData?.weight?.toString() || '',
          rir: lastData?.rir?.toString() || '',
          notes: lastData?.notes || '',
        }
      })
      setExerciseData(initialData)
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = () => {
    setShowStartDialog(false)
  }

  const handleFinishWorkout = async () => {
    try {
      const response = await fetch('/api/training/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: params.id,
          exerciseData: Object.entries(exerciseData).map(([exerciseId, data]) => ({
            exerciseId,
            reps: parseInt(data.reps) || 0,
            weight: parseFloat(data.weight) || 0,
            rir: parseInt(data.rir) || 0,
            notes: data.notes,
          })),
          ...endData,
          fatigueLevel: parseInt(endData.fatigueLevel),
          waterIntake: parseFloat(endData.waterIntake),
        }),
      })

      if (response.ok) {
        router.push('/dashboard/training')
      }
    } catch (error) {
      console.error('Error finishing workout:', error)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">Sesión no encontrada</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Entrenamiento</DialogTitle>
            <DialogDescription>
              ¿Estás listo para comenzar la sesión de hoy?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleStartWorkout}>Comenzar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Entrenamiento</DialogTitle>
            <DialogDescription>
              Cuéntanos cómo fue tu sesión de hoy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado Emocional</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={endData.emotionalState}
                onChange={(e) => setEndData({ ...endData, emotionalState: e.target.value })}
              >
                <option value="MUY_BIEN">Muy Bien</option>
                <option value="BIEN">Bien</option>
                <option value="NORMAL">Normal</option>
                <option value="CANSADO">Cansado</option>
                <option value="AGOTADO">Agotado</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nivel de Fatiga (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={endData.fatigueLevel}
                onChange={(e) => setEndData({ ...endData, fatigueLevel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Agua Consumida (litros)</Label>
              <Input
                type="number"
                step="0.1"
                value={endData.waterIntake}
                onChange={(e) => setEndData({ ...endData, waterIntake: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                value={endData.notes}
                onChange={(e) => setEndData({ ...endData, notes: e.target.value })}
                placeholder="Notas generales sobre el entrenamiento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinishWorkout}>Finalizar Sesión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{session.name}</CardTitle>
          {session.description && (
            <CardDescription>{session.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {session.exercises
          .sort((a, b) => a.order - b.order)
          .map((exercise) => {
            const lastData = session.lastWorkoutData[exercise.id]
            const currentData = exerciseData[exercise.id] || { reps: '', weight: '', rir: '', notes: '' }

            return (
              <Card key={exercise.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  {exercise.description && (
                    <CardDescription>{exercise.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {exercise.videoUrl && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full"
                        src={exercise.videoUrl}
                      >
                        Tu navegador no soporta videos
                      </video>
                    </div>
                  )}

                  {lastData && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Último Entrenamiento:
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Reps:</span> {lastData.reps}
                        </div>
                        <div>
                          <span className="text-blue-600">Carga:</span> {lastData.weight} kg
                        </div>
                        <div>
                          <span className="text-blue-600">RIR:</span> {lastData.rir}
                        </div>
                      </div>
                      {lastData.notes && (
                        <p className="text-sm text-blue-700 mt-2">
                          Nota: {lastData.notes}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Repeticiones</Label>
                      <Input
                        type="number"
                        value={currentData.reps}
                        onChange={(e) =>
                          setExerciseData({
                            ...exerciseData,
                            [exercise.id]: { ...currentData, reps: e.target.value },
                          })
                        }
                        placeholder="Reps"
                      />
                    </div>
                    <div>
                      <Label>Carga (kg)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={currentData.weight}
                        onChange={(e) =>
                          setExerciseData({
                            ...exerciseData,
                            [exercise.id]: { ...currentData, weight: e.target.value },
                          })
                        }
                        placeholder="Peso"
                      />
                    </div>
                    <div>
                      <Label>RIR</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={currentData.rir}
                        onChange={(e) =>
                          setExerciseData({
                            ...exerciseData,
                            [exercise.id]: { ...currentData, rir: e.target.value },
                          })
                        }
                        placeholder="RIR"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notas</Label>
                    <Input
                      value={currentData.notes}
                      onChange={(e) =>
                        setExerciseData({
                          ...exerciseData,
                          [exercise.id]: { ...currentData, notes: e.target.value },
                        })
                      }
                      placeholder="Notas sobre este ejercicio..."
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={() => setShowEndDialog(true)}>
          Finalizar Entrenamiento
        </Button>
      </div>
    </div>
  )
}
