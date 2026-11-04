import * as React from "react"

interface TabsContextValue {
  currentValue: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value, defaultValue = "", onValueChange, children, className }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const currentValue = value ?? internalValue

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setInternalValue(newValue)
        onValueChange?.(newValue)
      },
      [onValueChange]
    )

    return (
      <TabsContext.Provider value={{ currentValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={className} data-value={currentValue}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

interface TabsListProps {
  children: React.ReactNode
  className?: string
  currentValue?: string
  onValueChange?: (value: string) => void
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className || ""}`}
      role="tablist"
    >
      {children}
    </div>
  )
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  onValueChange?: (value: string) => void
  currentValue?: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, className, onValueChange, currentValue }, ref) => {
    const context = React.useContext(TabsContext)
    const activeValue = currentValue ?? context?.currentValue
    const handleSelect = onValueChange ?? context?.onValueChange
    const isActive = activeValue === value

    return (
      <button
        ref={ref}
        type="button"
        data-state={isActive ? "active" : "inactive"}
        onClick={() => handleSelect?.(value)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
        } ${className || ""}`}
        role="tab"
        aria-selected={isActive}
      >
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  currentValue?: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, currentValue }, ref) => {
    const context = React.useContext(TabsContext)
    const activeValue = currentValue ?? context?.currentValue
    const isActive = activeValue === value

    return (
      <div
        ref={ref}
        hidden={!isActive}
        data-state={isActive ? "active" : "inactive"}
        className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ""}`}
        role="tabpanel"
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
