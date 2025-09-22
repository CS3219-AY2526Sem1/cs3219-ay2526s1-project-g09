import { fetch } from "undici";

const ENDPOINT = "https://leetcode.com/graphql";
const baseHeaders = {
  "content-type": "application/json",
};

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

// Type guard to check if the response is a valid GraphQLResponse
function isGraphQLResponse<T>(
  response: unknown,
): response is GraphQLResponse<T> {
  return (
    typeof response === "object" && response !== null && "data" in response
  );
}

export async function gql<T, Tvariables>(
  query: string,
  variables: Tvariables,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ query, variables }),
  });

  const json: unknown = await res.json();

  // Type guard check
  if (!isGraphQLResponse<T>(json)) {
    throw new Error(`Invalid GraphQL response structure`);
  }

  if (json.errors) {
    throw new Error(`LeetCode GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
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
