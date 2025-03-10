import type { DReactionCore, Plugin } from '../';

export interface ImagePayload {
  uri: string;
  preview: string;
  caption?: string;
  width?: number;
  height?: number;
  filename?: string;
}

/**
 * Provides an image.
 */
const image = () => (dreaction: DReactionCore) => {
  return {
    features: {
      // expanded just to show the specs
      image: (payload: ImagePayload) => {
        const { uri, preview, filename, width, height, caption } = payload;
        return dreaction.send('image', {
          uri,
          preview,
          filename,
          width,
          height,
          caption,
        });
      },
    },
  } satisfies Plugin<DReactionCore>;
};

export default image;
