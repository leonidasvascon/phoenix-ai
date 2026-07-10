export type PublishableMedia = {
  localPath: string;
  publicUrl: string;
};

export interface PublishableMediaResolver {
  resolve(localPath: string): Promise<PublishableMedia>;
}
