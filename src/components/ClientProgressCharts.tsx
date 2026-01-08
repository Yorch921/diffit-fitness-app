'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WeightDataPoint {
  date: string
  weight: number
}

interface ClientProgressChartsProps {
  weightData: WeightDataPoint[]
}

export default function ClientProgressCharts({ weightData }: ClientProgressChartsProps) {
  if (weightData.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Evolución del Peso</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value) => `${value} kg`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
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
  )
}
