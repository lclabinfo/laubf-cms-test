import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

// The React component is imported dynamically to avoid circular deps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ImageUploadComponent: any = null

export function registerImageUploadComponent(component: unknown) {
  ImageUploadComponent = component
}

/**
 * Custom TipTap node that renders an image upload dropzone.
 * Clicking the dropzone opens a file picker. After file selection,
 * the node replaces itself with a standard Image node containing
 * the base64 data URL.
 */
export const ImageUpload = Node.create({
  name: "imageUpload",
  group: "block",
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="image-upload"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "image-upload" })]
  },

  addCommands() {
    return {
      setImageUpload:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({ type: this.name })
        },
    } as any
  },

  addNodeView() {
    if (!ImageUploadComponent) {
      throw new Error(
        "ImageUpload: React component not registered. Call registerImageUploadComponent() first."
      )
    }
    return ReactNodeViewRenderer(ImageUploadComponent)
  },
})
