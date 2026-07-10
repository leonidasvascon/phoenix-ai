import type { PublicationRequest, PublicationResult, PublicationValidation } from "../types/publication.ts";

export interface PublishingProvider {
  id: string;
  platform: string;

  validate(request: PublicationRequest): Promise<PublicationValidation>;

  publish(request: PublicationRequest): Promise<PublicationResult>;

  getStatus(publicationId: string): Promise<PublicationResult>;
}
