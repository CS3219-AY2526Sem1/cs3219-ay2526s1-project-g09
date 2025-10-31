export const QUERY_DETAIL = `
query question($titleSlug:String!){
  question(titleSlug:$titleSlug){
    title
    titleSlug
    isPaidOnly
    difficulty
    content
    exampleTestcases
    categoryTitle
    codeSnippets {
      lang
      langSlug
      code
    }
    hints
  }
}`;
