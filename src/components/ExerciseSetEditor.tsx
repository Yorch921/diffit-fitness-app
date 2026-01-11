'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface ExerciseSet {
  setNumber: number
  minReps: number
  maxReps: number
}

interface ExerciseSetEditorProps {
  sets: ExerciseSet[]
  onChange: (sets: ExerciseSet[]) => void
}

export default function ExerciseSetEditor({ sets, onChange }: ExerciseSetEditorProps) {
  const handleAddSet = () => {
    const newSet: ExerciseSet = {
      setNumber: sets.length + 1,
      minReps: 8,
      maxReps: 12,
    }
    onChange([...sets, newSet])
  }

  const handleRemoveSet = (index: number) => {
    if (sets.length === 1) {
      alert('Debe haber al menos una serie')
      return
    }
    const newSets = sets.filter((_, i) => i !== index)
    // Renumerar
    const renumbered = newSets.map((set, i) => ({ ...set, setNumber: i + 1 }))
    onChange(renumbered)
  }

  const handleChangeSet = (index: number, field: 'minReps' | 'maxReps', value: string) => {
    const numValue = parseInt(value) || 1
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], [field]: numValue }
    onChange(newSets)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Series y Repeticiones *</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddSet}>
          + Agregar Serie
        </Button>
      </div>

      <div className="space-y-3">
        {sets.map((set, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <span className="text-sm font-medium text-gray-700 w-20">Serie {set.setNumber}</span>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={set.minReps}
                onChange={(e) => handleChangeSet(index, 'minReps', e.target.value)}
                className="w-20"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                min="1"
                value={set.maxReps}
                onChange={(e) => handleChangeSet(index, 'maxReps', e.target.value)}
                className="w-20"
                placeholder="Max"
              />
              <span className="text-sm text-gray-600">reps</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveSet(index)}
              className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Define el rango de repeticiones para cada serie (ej: Serie 1: 9-10 reps)
      </p>
    </div>
  )
}
