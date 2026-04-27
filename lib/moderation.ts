import OpenAI from 'openai';

import { safeJsonParse } from '@/lib/util/json';

type ModeratePostInput = {
  activityDescription: string;
  locationName?: string;
  labels?: string[];
  photoUrls?: string[];
};

type ReviewResult = {
  decision?: 'approve' | 'review' | 'reject';
  spam?: boolean;
  inappropriate?: boolean;
  illegal?: boolean;
  reason?: string;
};

export type ModerationDecision = {
  approved: boolean;
  moderationStatus: 'approved' | 'flagged' | 'rejected';
  reason: string;
  raw: {
    review: ReviewResult;
    moderation: unknown;
  };
};

type ModerationResultLike = {
  flagged?: boolean;
  categories?: Record<string, boolean | undefined>;
};

function buildReviewPrompt(input: ModeratePostInput) {
  return [
    'You review hyperlocal community reports before they are published.',
    'Decide if the report should be approved, reviewed, or rejected.',
    'Reject spam, scams, obvious misinformation, harassment, explicit sexual content, threats, illegal facilitation, or content that encourages harm.',
    'Return valid JSON with keys: decision, spam, inappropriate, illegal, reason.',
    '',
    JSON.stringify(input),
  ].join('\n');
}

export async function moderatePost(
  input: ModeratePostInput,
): Promise<ModerationDecision> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      approved: true,
      moderationStatus: 'approved',
      reason: 'Post moderation bypassed because it is not configured.',
      raw: {
        review: {},
        moderation: null,
      },
    };
  }

  const openai = new OpenAI({ apiKey });

  const moderationInput = [
    {
      type: 'text',
      text: [
        input.locationName ? `Location: ${input.locationName}` : null,
        `Activity: ${input.activityDescription}`,
        input.labels?.length ? `Labels: ${input.labels.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    },
    ...(input.photoUrls ?? []).map((url) => ({
      type: 'image_url',
      image_url: { url },
    })),
  ];

  const moderation = await openai.moderations.create({
    model: process.env.OPENAI_MODERATION_MODEL ?? 'omni-moderation-latest',
    input: moderationInput as never,
  });

  const moderationResults = (
    moderation.results as unknown as ModerationResultLike[]
  ).map((result) => ({
    flagged: Boolean(result.flagged),
    categories: result.categories ?? {},
  }));

  const flagged = moderationResults.some((result) => result.flagged);

  const illegal = moderationResults.some(
    (result) =>
      result.categories['illicit'] || result.categories['illicit/violent'],
  );

  const inappropriate = moderationResults.some((result) =>
    Object.entries(result.categories).some(
      ([category, value]) =>
        value && !['illicit', 'illicit/violent'].includes(category),
    ),
  );

  const reviewResponse = await openai.responses.create({
    model: process.env.OPENAI_REVIEW_MODEL ?? 'gpt-4o-mini',
    input: buildReviewPrompt(input),
    temperature: 0,
    max_output_tokens: 250,
    text: {
      format: {
        type: 'json_object',
      },
    },
  });

  const review = safeJsonParse<ReviewResult>(reviewResponse.output_text, {});
  const spam = Boolean(review.spam);
  const reviewRejects = review.decision === 'reject';
  const reviewFlags = review.decision === 'review';
  const reviewIllegal = Boolean(review.illegal);
  const reviewInappropriate = Boolean(review.inappropriate);

  if (
    flagged ||
    illegal ||
    inappropriate ||
    reviewRejects ||
    reviewIllegal ||
    reviewInappropriate ||
    spam
  ) {
    return {
      approved: false,
      moderationStatus:
        illegal || reviewIllegal || inappropriate || reviewInappropriate
          ? 'rejected'
          : 'flagged',
      reason:
        review.reason ??
        (spam
          ? 'This post looks promotional or spammy.'
          : illegal || reviewIllegal
            ? 'This post appears to promote or describe illegal content.'
            : 'This post was flagged by the moderation pipeline.'),
      raw: {
        review,
        moderation,
      },
    };
  }

  if (reviewFlags) {
    return {
      approved: false,
      moderationStatus: 'flagged',
      reason:
        review.reason ?? 'This post needs manual review before publication.',
      raw: {
        review,
        moderation,
      },
    };
  }

  return {
    approved: true,
    moderationStatus: 'approved',
    reason: review.reason ?? 'Approved by the moderation pipeline.',
    raw: {
      review,
      moderation,
    },
  };
}
