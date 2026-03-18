"use client"

import { Separator } from "@/components/ui/separator"
import { ImageIcon } from "lucide-react"
import {
  EditorInput,
  TwoColumnGrid,
  ImagePickerField,
  ArrayField,
} from "./shared"

interface PhotoGalleryEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function PhotoGalleryEditor({
  content,
  onChange,
}: PhotoGalleryEditorProps) {
  const heading = (content.heading as string) ?? ""
  const images = (content.images as {
    src: string
    alt: string
    objectPosition?: string
  }[]) ?? []

  return (
    <div className="space-y-6">
      <EditorInput
        label="Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Gallery"
      />

      <Separator />

      <ArrayField
        label="Images"
        items={images}
        onItemsChange={(updated) => onChange({ ...content, images: updated })}
        createItem={() => ({ src: "", alt: "", objectPosition: undefined })}
        addLabel="Add Image"
        emptyIcon={ImageIcon}
        emptyMessage="No images added yet."
        emptyDescription='Click "Add Image" to build your photo gallery.'
        reorderable
        renderItem={(image, _i, updateItem) => (
          <>
            <ImagePickerField
              label="Image"
              value={image.src}
              onChange={(url) => updateItem({ ...image, src: url })}
            />

            <TwoColumnGrid>
              <EditorInput
                label="Alt Text"
                value={image.alt}
                onChange={(val) => updateItem({ ...image, alt: val })}
                placeholder="Photo description"
                labelSize="xs"
              />
              <EditorInput
                label="Object Position"
                value={image.objectPosition ?? ""}
                onChange={(val) => updateItem({ ...image, objectPosition: val })}
                placeholder="center center"
                labelSize="xs"
              />
            </TwoColumnGrid>
          </>
        )}
      />
    </div>
  )
}
