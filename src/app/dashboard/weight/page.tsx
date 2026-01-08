'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, formatWeight } from '@/lib/utils'

interface WeightEntry {
  id: string
  weight: number
  date: string
  notes: string | null
}

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [newEntry, setNewEntry] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/weight')
      const data = await response.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching weight entries:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: parseFloat(newEntry.weight),
          date: new Date(newEntry.date),
          notes: newEntry.notes || null,
        }),
      })

      if (response.ok) {
        setShowDialog(false)
        setNewEntry({
          weight: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        })
        fetchEntries()
      }
    } catch (error) {
      console.error('Error adding weight entry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta entrada?')) return

    try {
      await fetch(`/api/weight/${id}`, {
        method: 'DELETE',
      })
      fetchEntries()
    } catch (error) {
      console.error('Error deleting weight entry:', error)
    }
  }

  // Calcular media semanal
  const getWeeklyAverage = () => {
    if (entries.length === 0) return []

    const weeks: Record<string, { total: number; count: number; date: Date }> = {}

    entries.forEach((entry) => {
      const date = new Date(entry.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeks[weekKey]) {
        weeks[weekKey] = { total: 0, count: 0, date: weekStart }
      }

      weeks[weekKey].total += entry.weight
      weeks[weekKey].count += 1
    })

    return Object.entries(weeks)
      .map(([key, value]) => ({
        date: key,
        weight: value.total / value.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const weeklyData = getWeeklyAverage()

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Peso</DialogTitle>
            <DialogDescription>
              Añade una nueva entrada de peso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={newEntry.weight}
                onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })}
                placeholder="70.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                placeholder="Notas sobre el pesaje..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!newEntry.weight}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Peso</h1>
          <p className="mt-2 text-gray-600">
            Registra y visualiza tu evolución
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          Registrar Peso
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">⚖️</div>
            <h3 className="text-xl font-semibold mb-2">
              No hay registros de peso
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza a registrar tu peso para ver tu evolución
            </p>
            <Button onClick={() => setShowDialog(true)}>
              Registrar Primer Peso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Evolución del Peso (Media Semanal)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getDate()}/${date.getMonth() + 1}`
                    }}
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(value) => `${value.toFixed(1)} kg`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                    labelFormatter={(label) => `Semana del ${new Date(label).toLocaleDateString('es-ES')}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatWeight(entry.weight)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(entry.date)}
                          </div>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
