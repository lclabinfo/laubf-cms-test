import { NextRequest, NextResponse } from "next/server"
import { convertDocToHtml } from "@/lib/doc-convert"

/**
 * POST /api/v1/convert-doc
 *
 * Accepts a .doc file via multipart form data and returns HTML conversion.
 * Used by the CMS study-tab component for legacy Word 97-2003 files.
 *
 * Request: multipart/form-data with field "file" containing a .doc file
 * Response: { success: true, data: { html, isSerifDoc, dominantFont, serifFontFamily } }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided. Send a .doc file as multipart form data with field name 'file'." },
        { status: 400 },
      )
    }

    // Validate file extension
    const filename = file.name || "upload.doc"
    if (!filename.toLowerCase().endsWith(".doc")) {
      return NextResponse.json(
        { success: false, error: "Only .doc files are accepted. Use client-side mammoth.js for .docx files." },
        { status: 400 },
      )
    }

    // Validate file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 50MB.` },
        { status: 400 },
      )
    }

    // Read file into Buffer and convert
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await convertDocToHtml(buffer, filename)

    return NextResponse.json({
      success: true,
      data: {
        html: result.html,
        isSerifDoc: result.isSerifDoc,
        dominantFont: result.dominantFont,
        serifFontFamily: result.serifFontFamily,
      },
    })
  } catch (err) {
    console.error("[convert-doc] Conversion failed:", err)
    const message = err instanceof Error ? err.message : "Unknown conversion error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
