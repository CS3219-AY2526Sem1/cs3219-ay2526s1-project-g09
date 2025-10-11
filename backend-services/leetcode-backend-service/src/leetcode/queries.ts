export const QUERY_LIST = `
query problemsetQuestionList($categorySlug:String,$limit:Int,$skip:Int,$filters:QuestionListFilterInput){
  problemsetQuestionList: questionList(categorySlug:$categorySlug, limit:$limit, skip:$skip, filters:$filters){
    total: totalNum
    questions: data { title titleSlug difficulty isPaidOnly questionFrontendId }
  }
}`;

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
