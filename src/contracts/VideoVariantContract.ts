import { HomingURLType } from "../types/HomingURLType";
import { VariantDetails } from './CourseDetailsContract';

export interface VideoVariantProgressiveHomings {
  progressive: VideoVariant[];
}

export interface VideoVariantFiles {
  files: VideoVariantProgressiveHomings;
}

export interface VideoVariantExtractedJson {
  request: VideoVariantFiles;
}

export interface HomeLink {
  quality: string;
  url: string;
  type?: HomingURLType;
}

export interface VideoVariant extends VariantDetails {
  height?: number;
  width?: number;
  mime?: string;
  fps?: number;
  origin?: string;
}
