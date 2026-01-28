import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Plus, Sparkle, Trash, DownloadSimple, UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

type RACIValue = 'R' | 'A' | 'C' | 'I' | null

interface MatrixData {
  [taskId: string]: {
    [roleId: string]: RACIValue
  }
}

interface UserInfo {
  avatarUrl: string
  email: string
  id: number
  isOwner: boolean
  login: string
}

function App() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [roles, setRoles] = useKV<string[]>(user ? `raci-roles-${user.id}` : 'temp-roles', [])
  const [tasks, setTasks] = useKV<string[]>(user ? `raci-tasks-${user.id}` : 'temp-tasks', [])
  const [matrix, setMatrix] = useKV<MatrixData>(user ? `raci-matrix-${user.id}` : 'temp-matrix', {})
  
  const [newRole, setNewRole] = useState('')
  const [newTask, setNewTask] = useState('')
  const [editingRole, setEditingRole] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const [loadingCell, setLoadingCell] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await window.spark.user()
        setUser(userData)
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [])

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

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          toast.error('CSV file is empty or invalid')
          return
        }

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          
          return result
        }

        const headers = parseCSVLine(lines[0])
        const importedRoles = headers.slice(1)
        
        if (importedRoles.length === 0) {
          toast.error('No roles found in CSV')
          return
        }

        const importedTasks: string[] = []
        const importedMatrix: MatrixData = {}

        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i])
          if (cells.length === 0) continue
          
          const task = cells[0]
          if (!task) continue
          
          importedTasks.push(task)
          const taskIndex = importedTasks.length - 1
          
          importedMatrix[taskIndex] = {}
          
          for (let j = 1; j < cells.length && j <= importedRoles.length; j++) {
            const value = cells[j]?.trim().toUpperCase()
            const roleIndex = j - 1
            
            if (value && ['R', 'A', 'C', 'I'].includes(value)) {
              importedMatrix[taskIndex][roleIndex] = value as RACIValue
            }
          }
        }

        setRoles(importedRoles)
        setTasks(importedTasks)
        setMatrix(importedMatrix)
        
        toast.success(`Imported ${importedRoles.length} roles and ${importedTasks.length} tasks`)
      } catch (error) {
        console.error('Import error:', error)
        toast.error('Failed to import CSV file')
      }
    }

    reader.onerror = () => {
      toast.error('Failed to read file')
    }

    reader.readAsText(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const hasData = (roles?.length ?? 0) > 0 || (tasks?.length ?? 0) > 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <Sparkle className="w-12 h-12 text-accent mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-[32px] font-bold tracking-tight">RACI Matrix Builder</h1>
              <p className="text-muted-foreground">Define roles and tasks, then assign accountability with AI assistance</p>
            </div>
            <div className="flex items-center gap-3">
              {hasData && (
                <>
                  <Button onClick={exportToCSV} variant="outline" className="gap-2">
                    <DownloadSimple className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button onClick={triggerFileInput} variant="outline" className="gap-2">
                    <UploadSimple className="w-4 h-4" />
                    Import CSV
                  </Button>
                </>
              )}
              {!hasData && (
                <Button onClick={triggerFileInput} className="gap-2">
                  <UploadSimple className="w-4 h-4" />
                  Import CSV
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={importFromCSV}
                className="hidden"
              />
              {user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} alt={user.login} />
                        <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.login}</span>
                        {user.isOwner && (
                          <Badge variant="secondary" className="text-xs w-fit">Owner</Badge>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Signed in as {user.email}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
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
                  <div className="relative border rounded-lg overflow-hidden">
                    <div className="overflow-auto max-h-[600px]">
                      <div className="min-w-max">
                        <div className="grid gap-0" style={{
                          gridTemplateColumns: `200px repeat(${roles?.length ?? 0}, 140px)`
                        }}>
                          <div className="bg-muted border-b border-r p-3 font-semibold sticky left-0 z-20 bg-muted"></div>
                          
                          {roles?.map((role, roleIndex) => (
                            <div key={roleIndex} className="bg-muted border-b border-r p-3 flex items-center justify-between gap-2 group sticky top-0 z-10">
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
                                    className="border-b border-r p-2 relative group hover:bg-accent/5 transition-colors cursor-pointer bg-card"
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
                    </div>
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