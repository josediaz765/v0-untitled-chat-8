import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, ArrowRight, Clock } from "lucide-react"

interface VariableInfo {
  name: string
  occurrences: number
}

interface RenameResult {
  original: string
  renamed: string
  success: boolean
}

interface VariableListProps {
  variables: VariableInfo[]
  results?: RenameResult[]
  className?: string
}

export function VariableList({ variables, results = [], className = "" }: VariableListProps) {
  const resultMap = new Map(results.map((r) => [r.original, r]))

  if (variables.length === 0 && results.length === 0) {
    return (
      <div className={`text-muted-foreground text-center py-6 text-sm ${className}`}>No cryptic variables detected</div>
    )
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {variables.map((variable) => {
        const result = resultMap.get(variable.name)

        return (
          <div
            key={variable.name}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50 hover:border-primary/30 transition-colors"
          >
            {/* Status icon */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {result ? (
                result.success ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )
              ) : (
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>

            {/* Variable names */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
              <code className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs font-mono truncate max-w-[80px] sm:max-w-[120px]">
                {variable.name}
              </code>

              {result && (
                <>
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <code className="px-1.5 py-0.5 bg-accent/20 text-accent rounded text-xs font-mono truncate max-w-[80px] sm:max-w-[120px]">
                    {result.renamed}
                  </code>
                </>
              )}
            </div>

            {/* Usage count */}
            <Badge variant="secondary" className="flex-shrink-0 text-[10px] h-5 px-1.5">
              {variable.occurrences}x
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
