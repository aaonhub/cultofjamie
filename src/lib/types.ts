export interface Term {
  id: string
  name: string
  definition: string
  category: string
}

export interface Dictionary {
  terms: Term[]
  categories: string[]
}
