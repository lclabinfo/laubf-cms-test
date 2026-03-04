"use client"

import { PeopleSelect } from "@/components/cms/shared/people-select"

interface SpeakerSelectProps {
  value: string
  onChange: (name: string, id?: string) => void
}

export function SpeakerSelect({ value, onChange }: SpeakerSelectProps) {
  return (
    <PeopleSelect
      mode="single"
      roleSlug="speaker"
      roleLabel="speaker"
      value={value}
      onChange={onChange}
      placeholder="Select speaker..."
    />
  )
}
