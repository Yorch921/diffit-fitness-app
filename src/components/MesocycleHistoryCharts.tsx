'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface MesocycleHistoryChartsProps {
  weeklyData: Array<{
    weekNumber: number
    volume: number
    sets: number
    workouts: number
    avgRPE: number
  }>
}

export default function MesocycleHistoryCharts({ weeklyData }: MesocycleHistoryChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfica de Volumen */}
      <Card>
        <CardHeader>
          <CardTitle>Progresión de Volumen</CardTitle>
          <CardDescription>Volumen total (kg) por semana</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekNumber" label={{ value: 'Semana', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Volumen"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica de Series y Entrenamientos */}
      <Card>
        <CardHeader>
          <CardTitle>Series y Entrenamientos</CardTitle>
          <CardDescription>Cantidad por semana</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekNumber" label={{ value: 'Semana', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sets" fill="#10b981" name="Series" />
              <Bar dataKey="workouts" fill="#8b5cf6" name="Entrenamientos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica de RPE */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>RPE Promedio por Semana</CardTitle>
          <CardDescription>
            Intensidad percibida del esfuerzo (1-10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekNumber" label={{ value: 'Semana', position: 'insideBottom', offset: -5 }} />
              <YAxis domain={[0, 10]} label={{ value: 'RPE', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgRPE"
                stroke="#f59e0b"
                strokeWidth={2}
                name="RPE Promedio"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
