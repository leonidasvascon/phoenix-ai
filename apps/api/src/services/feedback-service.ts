import { FeedbackService, FileFeedbackStore } from "@phoenix-ai/feedback-engine";

const feedbackService = new FeedbackService(new FileFeedbackStore());

export function listFeedback() {
  return feedbackService.listFeedback();
}

export function getFeedback(executionId: string) {
  return feedbackService.getFeedback(executionId);
}

export function saveFeedback(input: unknown) {
  return feedbackService.saveFeedback(input);
}
