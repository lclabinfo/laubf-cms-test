"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    Strikethrough,
    List, 
    ListOrdered, 
    Heading1, 
    Heading2, 
    Quote, 
    Undo, 
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    QrCode
} from "lucide-react"
import { Button } from '@/app/components/ui/button'
import { Toggle } from '@/app/components/ui/toggle'
import { useEffect } from 'react'
import { cn } from '@/app/components/ui/utils'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            // @ts-ignore - Disabling potentially conflicting extensions from StarterKit
            StarterKit.configure({
                link: false,
                underline: false,
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Typography,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Update editor content if value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Check if the difference is significant to avoid cursor jumping
            // A simple check is to only update if the editor is empty and value is not, or drastic changes.
            // For now, we'll just setContent if it's different and not focused, or try to be smart.
            // Actually, setting content on every render causes cursor jump if we are typing.
            // So we only set it if the content is drastically different or initial load.
            // But since this is a controlled component, we rely on the parent to pass back the same value we just emitted.
            // We should only update if the passed value is different from current content.
            if (editor.getHTML() !== value) {
                 editor.commands.setContent(value)
            }
        }
    }, [value, editor])

    if (!editor) {
        return null
    }

    return (
        <div className={cn("border rounded-md overflow-hidden bg-card", className)}>
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('underline')}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('strike')}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                
                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 1 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                
                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('blockquote')}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const url = window.prompt('URL')
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run()
                        }
                    }}
                    className={cn(editor.isActive('link') && "bg-muted")}
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
                
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const url = window.prompt('Image URL')
                        if (url) {
                            editor.chain().focus().setImage({src: url}).run()
                        }
                    }}
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>

                <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <EditorContent editor={editor} />
        </div>
    )
}
