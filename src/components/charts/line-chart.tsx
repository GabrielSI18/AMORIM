'use client'

import { Line } from './index'
import type { ChartOptions } from 'chart.js'

interface LineChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor?: string
      backgroundColor?: string
    }[]
  }
  title?: string
}

export function LineChart({ data, title }: LineChartProps) {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
  }

  return (
    <div className="w-full h-[400px]">
      <Line options={options} data={data} />
    </div>
  )
}
