type ClassName<State> = string | ((state: State) => string | undefined) | undefined

function mergeClass<State>(base: string, className: ClassName<State>): string | ((state: State) => string) {
  if (typeof className === "function") return (state) => [base, className(state)].filter(Boolean).join(" ")
  return className ? `${base} ${className}` : base
}

export { mergeClass }
export type { ClassName }
