"use client"

import * as React from "react"

interface ProgressProps {
  value?: number
}

export function Progress({ value = 0 }: ProgressProps) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full bg-blue-600 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}