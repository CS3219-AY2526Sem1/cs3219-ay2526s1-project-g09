import { fetch } from "undici";

const ENDPOINT = "https://leetcode.com/graphql";
const baseHeaders = {
  "content-type": "application/json",
};

export async function gql<T, V>(
  query: string,
  variables: Record<string, V>,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ query, variables }),
  });

  // Type assertion to safely tell TypeScript that the response is of the expected type
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors) {
    throw new Error(`LeetCode GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

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
    title titleSlug questionFrontendId difficulty isPaidOnly
    content
    codeSnippets { lang langSlug code }
  }
}`;
