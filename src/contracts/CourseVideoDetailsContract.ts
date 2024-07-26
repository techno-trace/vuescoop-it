import { HomingURLType } from '../types/HomingURLType';
export default interface CourseVideoDetails{
    courseTitle: string,
    chapterTitle: string,
    videoTitle: string,
    chapterIdx: number,
    videoIdx: number,
    videoUrl: string,
    quality: string
    type?: HomingURLType
}