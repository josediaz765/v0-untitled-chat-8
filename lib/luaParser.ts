export interface VariableInfo {
  name: string
  occurrences: number
}

export interface ParsedCode {
  variables: VariableInfo[]
  lines: string[]
}

export function removeComments(code: string): string {
  // Remove single-line comments
  let result = code.replace(/--[^\n]*/g, "")

  // Remove multi-line comments
  result = result.replace(/--\[\[[\s\S]*?\]\]/g, "")

  return result
}

export function parseCode(code: string): ParsedCode {
  const lines = code.split("\n")

  // var5, var31, var44 (varN)
  // v_u_1, v_u_2 (v_u_N)
  // vu0, vu999 (vuN)
  // pu0, pu999 (puN)
  // l_1_0, l_var_0 (l_*_N)
  // fenv, success75 (specific obfuscated names)
  const varPattern = /\b(var\d+|[vp]u?_?[uw]?_?\d+|l_\w+_\d+|fenv|success\d+)\b/g
  const variableMap = new Map<string, number>()

  let match
  while ((match = varPattern.exec(code)) !== null) {
    const varName = match[1]
    variableMap.set(varName, (variableMap.get(varName) || 0) + 1)
  }

  const variables: VariableInfo[] = Array.from(variableMap.entries())
    .map(([name, occurrences]) => ({ name, occurrences }))
    .sort((a, b) => {
      // Sort by number in variable name
      const numA = Number.parseInt(a.name.replace(/\D/g, "")) || 0
      const numB = Number.parseInt(b.name.replace(/\D/g, "")) || 0
      return numA - numB
    })

  return { variables, lines }
}
