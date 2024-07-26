import { HomingURLType } from '../types/HomingURLType';

export interface CreatedAndUpdatedDetails {
    createdAtForHumans?: string 
    lastUpdatedAtForHumans?: string
}

export interface VariantDetails extends CreatedAndUpdatedDetails{
    url: string
    quality: string
    type?: HomingURLType
    id: string
}

export interface VideoDetails extends CreatedAndUpdatedDetails{
    title: string
    src: string
    variants?: VariantDetails[]
    fileName?: string
    downloadPath?: string
    err?: string | {}
    errAtForHumans?: string
    expiry?: string
    expiryForHumans?: string
    fetchedAt?: string
    fetchedAtForHumans?: string
    successfulStreaming: boolean
    streamingDetails?: PostHomingDetails
}

export interface ChapterDetails extends CreatedAndUpdatedDetails{
    title: string
    videos: VideoDetails[]
    successfulStreaming: boolean
    errors?: number
}

export default interface CourseDetails extends CreatedAndUpdatedDetails{
    title: string
    chapters: ChapterDetails[]
    successfulStreaming: boolean
    hasScreenshot?: string
    errors?: number
}

export interface PostHomingDetails extends VideoHomerDetails{
    fileName: string
    downloadPath: string
    selectedQuality: string
    streamingURLType: HomingURLType
    chapterID: number
    videoID: number
    downloadedIn: string
}

export interface VideoHomerDetails{
    fileSize?: string
    fileExists?: boolean
}