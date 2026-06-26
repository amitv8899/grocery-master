'use client'

import { useRef, useState } from 'react'
import type { Recipe, RecipeImport, ImportResult, ValidationError } from '@/lib/types'
import { validateRecipeJSON } from '@/lib/recipeImportUtils'
import { importRecipes } from '@/lib/recipesService'
import { RECIPE_IMPORT_TEMPLATE } from '@/lib/recipeImportTemplate'

type Props = {
  existingRecipes: Recipe[]
  onImportDone: (result: ImportResult) => void
  onClose: () => void
}

export default function RecipeImportSheet({ existingRecipes, onImportDone, onClose }: Props) {
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [jsonText, setJsonText] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [validatedRecipes, setValidatedRecipes] = useState<RecipeImport[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleCopyTemplate() {
    navigator.clipboard.writeText(RECIPE_IMPORT_TEMPLATE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileLoading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      setJsonText(event.target?.result as string)
      setFileLoading(false)
    }
    reader.readAsText(file)
  }

  function handleImportClick() {
    setParseError(null)
    setValidationErrors([])

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setParseError('Invalid JSON — check for missing commas or brackets')
      return
    }

    const result = validateRecipeJSON(parsed)
    if (result.errors.length > 0) {
      setValidationErrors(result.errors)
      return
    }

    setValidatedRecipes(result.recipes)
    setStep('preview')
  }

  async function handleConfirmImport() {
    setImportError(null)
    setImporting(true)
    try {
      const result = await importRecipes(validatedRecipes, existingRecipes)
      onImportDone(result)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setImporting(false)
    }
  }

  const importDisabled = fileLoading || jsonText.trim() === ''

  if (step === 'preview') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setStep('input')}
            className="text-sm text-accent-green font-medium"
            disabled={importing}
          >
            ← Back
          </button>
          <p className="text-base font-medium text-warm-text">
            Review ({validatedRecipes.length} recipe{validatedRecipes.length === 1 ? '' : 's'})
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-4 max-h-[40vh] overflow-y-auto">
          {validatedRecipes.map((r, i) => {
            const isMatch = existingRecipes.some(
              (e) => e.name.trim().toLowerCase() === r.name.trim().toLowerCase()
            )
            return (
              <div key={i} className="flex flex-col px-1 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-text font-medium">{r.name}</span>
                  <span className="text-xs text-warm-sub">
                    {r.ingredients.length} item{r.ingredients.length === 1 ? '' : 's'}
                  </span>
                </div>
                {isMatch && (
                  <span className="text-xs text-warm-sub mt-0.5">↳ will merge with existing</span>
                )}
              </div>
            )
          })}
        </div>

        {importError && (
          <p className="text-xs text-red-600 mb-3">{importError}</p>
        )}

        <button
          onClick={handleConfirmImport}
          disabled={importing}
          className="w-full py-[14px] rounded-xl bg-warm-text text-white text-[15px] font-medium disabled:opacity-50 mb-2 flex items-center justify-center gap-2"
        >
          {importing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Importing…
            </>
          ) : (
            'Confirm import'
          )}
        </button>

        <button
          onClick={onClose}
          disabled={importing}
          className="w-full py-2 text-sm text-warm-sub disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-base font-medium text-warm-text mb-4">Import Recipes</p>

      <button
        type="button"
        onClick={handleCopyTemplate}
        className="text-accent-green font-medium text-sm mb-3"
      >
        {copied ? 'Copied!' : '[ Copy template ]'}
      </button>

      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value)
          setValidationErrors([])
          setParseError(null)
        }}
        placeholder="Paste JSON here…"
        rows={6}
        className="w-full font-mono text-xs bg-warm-bg border border-warm-muted rounded-xl px-3 py-[11px] text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green resize-none mb-3"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload JSON file"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-accent-green font-medium text-sm mb-3"
      >
        [ Upload .json file ]
      </button>

      {parseError && (
        <p className="text-xs text-red-600 mb-3">{parseError}</p>
      )}

      {validationErrors.length > 0 && (
        <ul className="mb-3 max-h-32 overflow-y-auto">
          {validationErrors.map((err, i) => (
            <li key={i} className="text-xs text-red-600">
              {err.message}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleImportClick}
        disabled={importDisabled}
        className="w-full py-[14px] rounded-xl bg-warm-text text-white text-[15px] font-medium disabled:opacity-50"
      >
        Import
      </button>
    </div>
  )
}
