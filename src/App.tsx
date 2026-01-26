import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Plus, Sparkle, Trash, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

type RACIValue = 'R' | 'A' | 'C' | 'I' | null

interface MatrixData {
  [taskId: string]: {
    [roleId: string]: RACIValue
  }
}

function App() {
  const [roles, setRoles] = useKV<string[]>('raci-roles', [])
  const [tasks, setTasks] = useKV<string[]>('raci-tasks', [])
  const [matrix, setMatrix] = useKV<MatrixData>('raci-matrix', {})
  
  const [newRole, setNewRole] = useState('')
  const [newTask, setNewTask] = useState('')
  const [editingRole, setEditingRole] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const [loadingCell, setLoadingCell] = useState<string | null>(null)

  const addRole = () => {
    if (newRole.trim()) {
      setRoles((current) => [...(current ?? []), newRole.trim()])
      setNewRole('')
    }
  }

  const addTask = () => {
    if (newTask.trim()) {
      setTasks((current) => [...(current ?? []), newTask.trim()])
      setNewTask('')
    }
  }

  const deleteRole = (index: number) => {
    setRoles((current) => (current ?? []).filter((_, i) => i !== index))
    setMatrix((current) => {
      const updated = { ...(current ?? {}) }
      Object.keys(updated).forEach(taskId => {
        if (updated[taskId]) {
          delete updated[taskId][index.toString()]
        }
      })
      return updated
    })
  }

  const deleteTask = (index: number) => {
    setTasks((current) => (current ?? []).filter((_, i) => i !== index))
    setMatrix((current) => {
      const updated = { ...(current ?? {}) }
      delete updated[index.toString()]
      return updated
    })
  }

  const updateRole = (index: number, value: string) => {
    if (value.trim()) {
      setRoles((current) => {
        const updated = [...(current ?? [])]
        updated[index] = value.trim()
        return updated
      })
    }
    setEditingRole(null)
  }

  const updateTask = (index: number, value: string) => {
    if (value.trim()) {
      setTasks((current) => {
        const updated = [...(current ?? [])]
        updated[index] = value.trim()
        return updated
      })
    }
    setEditingTask(null)
  }

  const cycleRACIValue = (taskIndex: number, roleIndex: number) => {
    setMatrix((current) => {
      const updated = { ...(current ?? {}) }
      if (!updated[taskIndex]) {
        updated[taskIndex] = {}
      }
      
      const currentValue = updated[taskIndex][roleIndex]
      const cycle: (RACIValue)[] = [null, 'R', 'A', 'C', 'I']
      const currentIdx = cycle.indexOf(currentValue)
      updated[taskIndex][roleIndex] = cycle[(currentIdx + 1) % cycle.length]
      
      return updated
    })
  }

  const getRACIColor = (value: RACIValue): string => {
    switch (value) {
      case 'R': return 'bg-[var(--raci-r)] text-white'
      case 'A': return 'bg-[var(--raci-a)] text-white'
      case 'C': return 'bg-[var(--raci-c)] text-white'
      case 'I': return 'bg-[var(--raci-i)] text-primary'
      default: return ''
    }
  }

  const suggestRACIValue = async (taskIndex: number, roleIndex: number) => {
    const cellKey = `${taskIndex}-${roleIndex}`
    setLoadingCell(cellKey)
    
    try {
      const task = tasks?.[taskIndex]
      const role = roles?.[roleIndex]
      
      if (!task || !role) {
        toast.error('Task or role not found')
        return
      }
      
      const promptText = `You are a RACI matrix expert. Given a task and a role, suggest the most appropriate RACI designation.

RACI definitions:
- R (Responsible): Does the work to complete the task
- A (Accountable): Ultimately answerable for the task's completion and has final authority
- C (Consulted): Provides input and expertise (two-way communication)
- I (Informed): Kept up-to-date on progress (one-way communication)

Task: ${task}
Role: ${role}

Based on typical business practices and the nature of this task and role, what is the most appropriate RACI designation? Respond with ONLY a single letter: R, A, C, or I. No explanation.`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini')
      const suggestion = response.trim().toUpperCase()
      
      if (['R', 'A', 'C', 'I'].includes(suggestion)) {
        setMatrix((current) => {
          const updated = { ...(current ?? {}) }
          if (!updated[taskIndex]) {
            updated[taskIndex] = {}
          }
          updated[taskIndex][roleIndex] = suggestion as RACIValue
          return updated
        })
        toast.success(`AI suggested: ${suggestion}`)
      } else {
        toast.error('Unable to generate suggestion')
      }
    } catch (error) {
      console.error('AI suggestion error:', error)
      toast.error('Failed to get AI suggestion')
    } finally {
      setLoadingCell(null)
    }
  }

  const exportToCSV = () => {
    if (!roles?.length || !tasks?.length) {
      toast.error('No data to export')
      return
    }

    const csvRows: string[] = []
    
    const headers = ['Task', ...(roles ?? [])]
    csvRows.push(headers.map(h => `"${h}"`).join(','))
    
    tasks?.forEach((task, taskIndex) => {
      const row = [task]
      roles?.forEach((_, roleIndex) => {
        const value = matrix?.[taskIndex]?.[roleIndex] || ''
        row.push(value)
      })
      csvRows.push(row.map(cell => `"${cell}"`).join(','))
    })
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'raci-matrix.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Matrix exported to CSV')
  }

  const hasData = (roles?.length ?? 0) > 0 || (tasks?.length ?? 0) > 0

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-[32px] font-bold tracking-tight">RACI Matrix Builder</h1>
              <p className="text-muted-foreground">Define roles and tasks, then assign accountability with AI assistance</p>
            </div>
            {hasData && (
              <Button onClick={exportToCSV} className="gap-2">
                <DownloadSimple className="w-4 h-4" />
                Export CSV
              </Button>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new role..."
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addRole()}
                      />
                      <Button onClick={addRole}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      />
                      <Button onClick={addTask}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {!hasData ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="text-6xl">📊</div>
                    <h3 className="text-xl font-semibold">Get Started</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Add your first role and task to begin building your RACI matrix
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <ScrollArea className="h-[600px] w-full">
                      <div className="min-w-max pb-4">
                        <div className="grid gap-0 border rounded-lg overflow-hidden" style={{
                          gridTemplateColumns: `200px repeat(${roles?.length ?? 0}, 140px)`
                        }}>
                          <div className="bg-muted border-b border-r p-3 font-semibold sticky left-0 z-10"></div>
                          
                          {roles?.map((role, roleIndex) => (
                            <div key={roleIndex} className="bg-muted border-b border-r p-3 flex items-center justify-between gap-2 group">
                              {editingRole === roleIndex ? (
                                <Input
                                  defaultValue={role}
                                  autoFocus
                                  onBlur={(e) => updateRole(roleIndex, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateRole(roleIndex, e.currentTarget.value)
                                    }
                                  }}
                                  className="h-7 text-sm"
                                />
                              ) : (
                                <>
                                  <span 
                                    className="font-medium text-sm flex-1 cursor-pointer"
                                    onClick={() => setEditingRole(roleIndex)}
                                  >
                                    {role}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteRole(roleIndex)}
                                  >
                                    <Trash className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}

                          {tasks?.map((task, taskIndex) => (
                            <>
                              <div key={`task-${taskIndex}`} className="bg-muted border-b border-r p-3 flex items-center justify-between gap-2 sticky left-0 z-10 group">
                                {editingTask === taskIndex ? (
                                  <Input
                                    defaultValue={task}
                                    autoFocus
                                    onBlur={(e) => updateTask(taskIndex, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        updateTask(taskIndex, e.currentTarget.value)
                                      }
                                    }}
                                    className="h-7 text-sm"
                                  />
                                ) : (
                                  <>
                                    <span 
                                      className="font-medium text-sm flex-1 cursor-pointer"
                                      onClick={() => setEditingTask(taskIndex)}
                                    >
                                      {task}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => deleteTask(taskIndex)}
                                    >
                                      <Trash className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>

                              {roles?.map((_, roleIndex) => {
                                const value = matrix?.[taskIndex]?.[roleIndex]
                                const cellKey = `${taskIndex}-${roleIndex}`
                                const isLoading = loadingCell === cellKey

                                return (
                                  <div
                                    key={`cell-${taskIndex}-${roleIndex}`}
                                    className="border-b border-r p-2 relative group hover:bg-accent/5 transition-colors cursor-pointer"
                                    onClick={() => !isLoading && cycleRACIValue(taskIndex, roleIndex)}
                                  >
                                    <div className="flex items-center justify-center gap-1 h-full min-h-[60px]">
                                      {isLoading ? (
                                        <div className="animate-pulse">
                                          <Sparkle className="w-5 h-5 text-accent" />
                                        </div>
                                      ) : value ? (
                                        <Badge className={`${getRACIColor(value)} text-base font-bold px-3 py-1`}>
                                          {value}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">Click</span>
                                      )}
                                    </div>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            suggestRACIValue(taskIndex, roleIndex)
                                          }}
                                          disabled={isLoading}
                                        >
                                          <Sparkle className="w-3 h-3 text-accent" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>AI Suggestion</TooltipContent>
                                    </Tooltip>
                                  </div>
                                )
                              })}
                            </>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4">RACI Legend</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--raci-r)] text-white font-bold w-8 h-8 flex items-center justify-center">R</Badge>
                      <span className="font-semibold text-sm">Responsible</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Does the work to complete the task
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--raci-a)] text-white font-bold w-8 h-8 flex items-center justify-center">A</Badge>
                      <span className="font-semibold text-sm">Accountable</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ultimately answerable for completion and has final authority
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--raci-c)] text-white font-bold w-8 h-8 flex items-center justify-center">C</Badge>
                      <span className="font-semibold text-sm">Consulted</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Provides input and expertise (two-way communication)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--raci-i)] text-primary font-bold w-8 h-8 flex items-center justify-center">I</Badge>
                      <span className="font-semibold text-sm">Informed</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Kept up-to-date on progress (one-way communication)
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkle className="w-4 h-4" />
                    <span className="font-semibold text-sm">AI Powered</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click the sparkle icon on any cell to get AI-powered RACI suggestions based on the role and task
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App