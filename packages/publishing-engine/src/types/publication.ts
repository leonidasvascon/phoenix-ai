export type PublicationStatus = "draft" | "validated" | "queued" | "publishing" | "published" | "failed" | "cancelled";

export type PublicationRequest = {
  execution_id: string;
  platform: string;
  provider?: string;
  format: string;
  caption: string;
  hashtags: string[];
  media_path: string;
  thumbnail_path: string;
  metadata_path?: string;
  assets_manifest_path?: string;
  scheduled_at?: string | null;
  dry_run?: boolean;
  allow_fallback_assets?: boolean;
};

export type PublicationValidation = {
  valid: boolean;
  fallback_assets: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  errors: string[];
};

export type PublicationResult = {
  id: string;
  execution_id: string;
  platform: string;
  requested_provider: string;
  effective_provider: string;
  status: PublicationStatus;
  dry_run: boolean;
  allow_fallback_assets: boolean;
  fallback_assets: boolean;
  format: string;
  caption: string;
  hashtags: string[];
  media_path: string;
  thumbnail_path: string;
  metadata_path?: string;
  assets_manifest_path?: string;
  scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  cancelled_at?: string | null;
  external_id?: string | null;
  validation: PublicationValidation;
  error?: string | null;
};
