"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

type ImportStep = "upload" | "preview" | "importing" | "complete"

type ParsedRow = Record<string, string>

const CSV_TEMPLATE = `firstName,lastName,preferredName,email,phone,membershipStatus
John,Smith,,john@example.com,(555) 123-4567,MEMBER
Jane,Doe,Janie,jane@example.com,(555) 987-6543,VISITOR`

function parseCSVPreview(csvText: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = csvText.split("\n").filter((line) => line.trim())
  if (lines.length < 1) return { headers: [], rows: [] }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"))
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"))
    const row: ParsedRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ""
    })
    rows.push(row)
  }

  return { headers, rows }
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [csvText, setCsvText] = useState("")
  const [fileName, setFileName] = useState("")
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] }>({ headers: [], rows: [] })
  const [importResult, setImportResult] = useState<{ imported: number; errors: { row: number; error: string }[]; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("upload")
    setCsvText("")
    setFileName("")
    setParsedData({ headers: [], rows: [] })
    setImportResult(null)
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFileSelect = useCallback((file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvText(text)
      const parsed = parseCSVPreview(text)
      setParsedData(parsed)
      setStep("preview")
    }
    reader.readAsText(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      handleFileSelect(file)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "members-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    setStep("importing")
    try {
      const res = await fetch("/api/v1/people/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      })
      const json = await res.json()

      if (json.success) {
        setImportResult(json.data)
      } else {
        setImportResult({ imported: 0, errors: [{ row: 0, error: json.error?.message ?? "Import failed" }], total: parsedData.rows.length })
      }
    } catch (err) {
      setImportResult({
        imported: 0,
        errors: [{ row: 0, error: err instanceof Error ? err.message : "Import failed" }],
        total: parsedData.rows.length,
      })
    }
    setStep("complete")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Import Members</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to import members in bulk."}
            {step === "preview" && `${parsedData.rows.length} rows found in ${fileName}. Review before importing.`}
            {step === "importing" && "Importing members..."}
            {step === "complete" && "Import complete."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <Upload className="size-8 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={downloadTemplate}>
              <Download className="size-3.5 mr-1.5" />
              Download Template
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <Badge variant="secondary">{parsedData.rows.length} rows</Badge>
            </div>

            {/* Preview table */}
            <div className="rounded-lg border overflow-auto max-h-[240px]">
              <table className="text-xs w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">#</th>
                    {parsedData.headers.slice(0, 5).map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      {parsedData.headers.slice(0, 5).map((h) => (
                        <td key={h} className="px-2 py-1.5 truncate max-w-[120px]">
                          {row[h] || <span className="text-muted-foreground">--</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedData.rows.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                ...and {parsedData.rows.length - 5} more rows
              </p>
            )}

            {/* Validation check */}
            {parsedData.headers.includes("firstName") && parsedData.headers.includes("lastName") ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="size-4" />
                Required columns found (firstName, lastName)
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" />
                Missing required columns: firstName, lastName
              </div>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Importing {parsedData.rows.length} members...</p>
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              {importResult.imported > 0 ? (
                <CheckCircle2 className="size-10 text-success" />
              ) : (
                <AlertTriangle className="size-10 text-destructive" />
              )}
              <div className="text-center">
                <p className="font-medium">
                  {importResult.imported} of {importResult.total} members imported
                </p>
                {importResult.errors.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {importResult.errors.length} {importResult.errors.length === 1 ? "error" : "errors"} occurred
                  </p>
                )}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-lg border p-3 max-h-[160px] overflow-auto space-y-1">
                {importResult.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="size-3 shrink-0 text-destructive mt-0.5" />
                    <span>
                      {err.row > 0 ? `Row ${err.row}: ` : ""}{err.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!parsedData.headers.includes("firstName") || !parsedData.headers.includes("lastName")}
              >
                Import {parsedData.rows.length} Members
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button
              onClick={() => {
                onImportComplete()
                handleOpenChange(false)
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
