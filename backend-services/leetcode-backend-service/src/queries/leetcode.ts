/**
 * GraphQL client for LeetCode's API.
 */
import { fetch } from "undici";

const ENDPOINT = "https://leetcode.com/graphql";
const baseHeaders = {
  "content-type": "application/json",
  accept: "application/json, text/plain, */*",
  origin: "https://leetcode.com",
  referer: "https://leetcode.com/",
  // Set a UserAgent to avoid 403 from Cloudflare
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
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

  const ctype = res.headers.get("content-type") || "";
  const raw = await res.text(); // <-- read as text first

  if (!res.ok) {
    throw new Error(
      `LeetCode HTTP ${res.status} ${res.statusText}; ctype=${ctype}; body=${raw.slice(0, 200)}`,
    );
  }

  if (!ctype.includes("application/json")) {
    throw new Error(
      `LeetCode non-JSON response; ctype=${ctype}; body=${raw.slice(0, 200)}`,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Failed to parse JSON: ${String(e)}; body=${raw.slice(0, 200)}`,
    );
  }

  if (!isGraphQLResponse<T>(json)) {
    throw new Error(
      `Invalid GraphQL response structure; body=${raw.slice(0, 200)}`,
    );
  }

  if (json.errors?.length) {
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
