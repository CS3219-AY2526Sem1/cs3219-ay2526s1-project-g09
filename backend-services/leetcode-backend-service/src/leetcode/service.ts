/**
 * Service functions to interact with LeetCode's API and manage question data.
 */
import { gql } from "./client.js";
import { QUERY_LIST, QUERY_DETAIL } from "./queries.js";
import pLimit from "p-limit";
import { Question } from "../db/model/question.js";
import type { BasicInformation, Details, QuestionList } from "./types.js";

const PAGE_SIZE = 10;
const DETAIL_CONCURRENCY = 6;

export async function upsertMany(questions: Details["question"][]) {
  const aggregate = questions
    .filter(
      (question): question is NonNullable<Details["question"]> =>
        Boolean(question) &&
        question != null &&
        typeof question.titleSlug === "string" &&
        question.titleSlug.length > 0,
    )
    .map((question) => ({
      updateOne: {
        filter: { titleSlug: question.titleSlug },
        update: {
          $set: {
            ...question,
            lastSyncedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

  if (aggregate.length) {
    await Question.bulkWrite(aggregate, { ordered: false });
  }
}

export async function syncAllNonPaid() {
  const questionList = await fetchAllNonPaidSlugs();
  const limit = pLimit(DETAIL_CONCURRENCY);

  const details = await Promise.all(
    questionList.map((question: BasicInformation) =>
      limit(async () => {
        const detail = await getQuestionDetail(question.titleSlug);
        if (detail && !detail.isPaidOnly) {
          return detail;
        }
        return null;
      }),
    ),
  );

  await upsertMany(details as NonNullable<Details["question"]>[]);
  return {
    scanned: questionList.length,
    upserted: details.filter(Boolean).length,
  };
}

export async function fetchAllNonPaidSlugs(): Promise<BasicInformation[]> {
  let skip = 0;
  let total = Infinity;
  const out: BasicInformation[] = [];

  while (skip < total) {
    const res = await gql<
      QuestionList,
      {
        categorySlug: string;
        limit: number;
        skip: number;
        filters: Record<string, unknown>;
      }
    >(QUERY_LIST, {
      categorySlug: "",
      limit: PAGE_SIZE,
      skip: skip,
      filters: {},
    });

    const questionList = res.problemsetQuestionList;
    total = questionList.total ?? 0;
    const questions: BasicInformation[] = questionList.questions;

    for (const question of questions) {
      if (!question.isPaidOnly) {
        out.push(question);
      }
    }

    skip = skip + PAGE_SIZE;
    await new Promise((r) => setTimeout(r, 130));
  }

  return out;
}

export async function getQuestionDetail(slug: string) {
  const res = await gql<Details, { titleSlug: string }>(QUERY_DETAIL, {
    titleSlug: slug,
  });
  return res.question;
}
