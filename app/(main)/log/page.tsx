'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Subtask } from '@/types/database'
import { TIME_CHIPS, formatTimerDisplay } from '@/lib/utils'

type CategoryWithSubtasks = Category & { subtasks: Subtask[] }

type LogStep = 'category' | 'subtask' | 'time'
type EntryMode = 'quick' | 'timer'

export default function LogPage() {
  const [categories, setCategories] = useState<CategoryWithSubtasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<LogStep>('category')
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSubtasks | null>(null)
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null)

  // Time entry state
  const [entryMode, setEntryMode] = useState<EntryMode>('quick')
  const [selectedChip, setSelectedChip] = useState<number | null>(null)
  const [customMinutes, setCustomMinutes] = useState('')
  const [occurrences, setOccurrences] = useState(1)
  const [note, setNote] = useState('')

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Timer interval effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timerRunning])

  const startTimer = useCallback(() => setTimerRunning(true), [])
  const pauseTimer = useCallback(() => setTimerRunning(false), [])
  const resetTimer = useCallback(() => {
    setTimerRunning(false)
    setTimerSeconds(0)
  }, [])

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  function showToast(message: string, type: 'success' | 'error') {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 2000)
  }

  async function handleSubmit() {
    if (!canSubmit || !selectedCategory || !selectedSubtask) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Not authenticated', 'error')
        setSubmitting(false)
        return
      }

      const verified = entryMode === 'timer' && timerSeconds > 0

      const { error: insertError } = await supabase.from('log_entries').insert({
        user_id: user.id,
        category_id: selectedCategory.id,
        subtask_id: selectedSubtask.id,
        minutes: effectiveMinutes,
        occurrences,
        note: note || null,
        verified,
      })

      if (insertError) {
        showToast('Failed to log entry', 'error')
        setSubmitting(false)
        return
      }

      showToast('Entry logged ✅', 'success')
      // Reset all state and return to category selection
      resetTimeEntry()
      setSelectedCategory(null)
      setSelectedSubtask(null)
      setStep('category')
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('team')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*, subtasks(*)')
        .eq('team', profile.team)
        .order('sort_order')

      if (fetchError) {
        setError('Failed to load categories')
        setLoading(false)
        return
      }

      setCategories((data as CategoryWithSubtasks[]) ?? [])
      setLoading(false)
    }

    fetchCategories()
  }, [])

  function handleCategorySelect(category: CategoryWithSubtasks) {
    setSelectedCategory(category)
    setStep('subtask')
  }

  function handleSubtaskSelect(subtask: Subtask) {
    setSelectedSubtask(subtask)
    setStep('time')
  }

  function handleBack() {
    if (step === 'subtask') {
      setStep('category')
      setSelectedCategory(null)
      setSelectedSubtask(null)
    } else if (step === 'time') {
      setStep('subtask')
      setSelectedSubtask(null)
      resetTimeEntry()
    }
  }

  function resetTimeEntry() {
    setEntryMode('quick')
    setSelectedChip(null)
    setCustomMinutes('')
    setOccurrences(1)
    setNote('')
    setTimerRunning(false)
    setTimerSeconds(0)
  }

  function handleChipSelect(minutes: number) {
    if (selectedChip === minutes) {
      setSelectedChip(null)
      setCustomMinutes('')
    } else {
      setSelectedChip(minutes)
      setCustomMinutes(String(minutes))
    }
  }

  function handleCustomMinutesChange(value: string) {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '')
    setCustomMinutes(cleaned)
    const num = parseInt(cleaned, 10)
    if (TIME_CHIPS.includes(num as typeof TIME_CHIPS[number])) {
      setSelectedChip(num)
    } else {
      setSelectedChip(null)
    }
  }

  function handleOccurrenceChange(delta: number) {
    setOccurrences(prev => Math.max(1, prev + delta))
  }

  // Compute the effective minutes for the submit button label
  const timerMinutes = Math.ceil(timerSeconds / 60)
  const effectiveMinutes = entryMode === 'quick'
    ? (selectedChip ?? (customMinutes ? parseInt(customMinutes, 10) : 0))
    : timerMinutes
  const canSubmit = effectiveMinutes > 0 && !timerRunning

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-start rounded-xl border border-mpl-border bg-mpl-surface p-4"
            >
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-1 h-3 w-14 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            window.location.reload()
          }}
          className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition-colors duration-150 active:scale-[0.97] hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[fadeIn_150ms_ease-out] rounded-xl px-5 py-3 text-sm font-semibold shadow-sm ${
            toast.type === 'success'
              ? 'border-l-4 border-green-500 bg-white text-green-700'
              : 'border-l-4 border-red-500 bg-white text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Breadcrumb */}
      {step !== 'category' && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-mpl-border bg-mpl-surface text-slate-500 transition-colors duration-150 active:scale-[0.97]"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sm text-slate-500">
            <button
              type="button"
              className={`shrink-0 ${step === 'subtask' ? 'font-medium text-slate-800' : 'cursor-pointer text-mpl-primary hover:underline'}`}
              onClick={step !== 'subtask' ? () => { setStep('subtask'); setSelectedSubtask(null) } : undefined}
            >
              {selectedCategory?.icon} {selectedCategory?.label}
            </button>
            {step === 'time' && selectedSubtask && (
              <>
                <span className="shrink-0 text-slate-300">›</span>
                <span className="truncate font-medium text-slate-800">
                  {selectedSubtask.label}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 'category' && (
        <div className="animate-[slideUp_150ms_ease-out]">
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Select Category
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="flex min-w-0 flex-col items-start rounded-xl border border-mpl-border bg-mpl-surface p-3 text-left transition-colors duration-150 active:scale-[0.97] active:bg-mpl-primary-light sm:p-4"
              >
                <span className="text-2xl leading-none">{category.icon}</span>
                <span className="mt-2 break-words text-sm font-semibold leading-tight text-slate-800">
                  {category.label}
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  {category.subtasks.length} {category.subtasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Subtask Selection */}
      {step === 'subtask' && selectedCategory && (
        <div className="animate-[slideUp_150ms_ease-out]">
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Select Sub-task
          </h2>
          <div className="overflow-hidden rounded-xl border border-mpl-border bg-mpl-surface">
            {selectedCategory.subtasks
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((subtask, index) => (
                <button
                  key={subtask.id}
                  onClick={() => handleSubtaskSelect(subtask)}
                  className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 active:bg-mpl-primary-light ${
                    index < selectedCategory.subtasks.length - 1
                      ? 'border-b border-mpl-border'
                      : ''
                  }`}
                >
                  <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                    {subtask.label}
                  </span>
                  <span className="shrink-0 text-slate-300">›</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Step 3: Time Entry */}
      {step === 'time' && selectedCategory && selectedSubtask && (
        <div className="animate-[slideUp_150ms_ease-out] space-y-4">
          {/* Context pill */}
          <div className="flex items-center gap-2 rounded-xl border border-mpl-border bg-mpl-primary-light px-4 py-2.5">
            <span className="text-lg">{selectedCategory.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-mpl-primary-dark">{selectedCategory.label}</p>
              <p className="truncate text-sm font-semibold text-slate-800">{selectedSubtask.label}</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-mpl-border bg-mpl-surface p-1">
            <button
              type="button"
              onClick={() => setEntryMode('quick')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-150 ${
                entryMode === 'quick'
                  ? 'bg-mpl-primary text-white'
                  : 'text-slate-500'
              }`}
            >
              Quick Entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('timer')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-150 ${
                entryMode === 'timer'
                  ? 'bg-mpl-primary text-white'
                  : 'text-slate-500'
              }`}
            >
              Timer
            </button>
          </div>

          {/* Quick Entry mode */}
          {entryMode === 'quick' && (
            <div className="space-y-4">
              {/* Time chips */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time Spent
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_CHIPS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleChipSelect(minutes)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors duration-150 active:scale-[0.97] ${
                        selectedChip === minutes
                          ? 'border-mpl-primary bg-mpl-primary text-white'
                          : 'border-mpl-border bg-mpl-surface text-slate-700'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                  {/* Custom input */}
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Custom"
                      value={customMinutes && !TIME_CHIPS.includes(parseInt(customMinutes, 10) as typeof TIME_CHIPS[number]) ? customMinutes : ''}
                      onChange={(e) => handleCustomMinutesChange(e.target.value)}
                      className="w-[4.5rem] rounded-full border border-mpl-border bg-mpl-surface px-2.5 py-1.5 text-center text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-mpl-primary focus:outline-none"
                    />
                    {customMinutes && !TIME_CHIPS.includes(parseInt(customMinutes, 10) as typeof TIME_CHIPS[number]) && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timer mode */}
          {entryMode === 'timer' && (
            <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-8 text-center">
              {/* Timer display */}
              <p className="font-mono text-5xl font-bold text-slate-800">
                {formatTimerDisplay(timerSeconds)}
              </p>

              {/* Timer controls */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {!timerRunning && timerSeconds > 0 && (
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="rounded-xl border border-mpl-border bg-mpl-surface px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-150 active:scale-[0.97]"
                  >
                    Reset
                  </button>
                )}
                {timerRunning ? (
                  <button
                    type="button"
                    onClick={pauseTimer}
                    className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-colors duration-150 active:scale-[0.97]"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startTimer}
                    className="rounded-xl bg-mpl-primary px-6 py-2.5 text-sm font-bold text-white transition-colors duration-150 active:scale-[0.97]"
                  >
                    {timerSeconds > 0 ? 'Resume' : 'Start'}
                  </button>
                )}
              </div>

              {/* Timer info */}
              {timerSeconds > 0 && !timerRunning && (
                <p className="mt-3 text-sm text-slate-500">
                  {timerMinutes} {timerMinutes === 1 ? 'minute' : 'minutes'} will be logged
                </p>
              )}
            </div>
          )}

          {/* Occurrences stepper */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Occurrences
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOccurrenceChange(-1)}
                disabled={occurrences <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-mpl-border bg-mpl-surface text-lg font-bold text-slate-600 transition-colors duration-150 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={occurrences}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (val > 0) setOccurrences(val)
                  else if (e.target.value === '') setOccurrences(1)
                }}
                className="h-10 w-14 rounded-xl border border-mpl-border bg-mpl-surface text-center text-lg font-bold text-slate-800 focus:border-mpl-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleOccurrenceChange(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-mpl-border bg-mpl-surface text-lg font-bold text-slate-600 transition-colors duration-150 active:scale-[0.97]"
              >
                +
              </button>
              <span className="shrink text-xs text-slate-400 sm:text-sm">How many times?</span>
            </div>
          </div>

          {/* Note textarea */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Note <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a quick note..."
              rows={2}
              className="w-full resize-none rounded-xl border border-mpl-border bg-mpl-surface px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-mpl-primary focus:outline-none"
            />
          </div>

          {/* Submit button */}
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-mpl-primary py-3.5 text-base font-bold text-white transition-colors duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          >
            {submitting ? 'Logging...' : canSubmit ? `Log ${effectiveMinutes}m Entry` : 'Log Entry'}
          </button>
        </div>
      )}
    </div>
  )
}
