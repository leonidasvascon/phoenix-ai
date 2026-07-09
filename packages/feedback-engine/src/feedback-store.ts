export type ContentFeedback = {
  execution_id: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
  posted_at: string;
  created_at: string;
  updated_at: string;
};

export type FeedbackInput = Omit<ContentFeedback, "created_at" | "updated_at">;

export interface FeedbackStore {
  list(): Promise<ContentFeedback[]>;
  getByExecutionId(executionId: string): Promise<ContentFeedback | null>;
  save(input: FeedbackInput): Promise<ContentFeedback>;
}
