import coverArtwork from "./cover-artwork.json";

export type CoverArtwork = {
  front: string;
  back?: string;
  binding?: "top";
  discs?: number;
  accessory?: string;
};

export function getCoverArtwork(image: string | null | undefined): CoverArtwork | undefined {
  return image ? (coverArtwork as Record<string, CoverArtwork>)[image] : undefined;
}
