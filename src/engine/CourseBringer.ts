import { Browser, Page } from "puppeteer";
import TheBeautifulWriter from "../utils/TheBeautifulWriter";
import Stringer from "../utils/Stringer";
import VideoVariantsFinder from "./VideoVariantsFinder";
import rootPath from "app-root-path";
import { outputFile, pathExists, readJSON, writeJSON } from "fs-extra";
import TheFlysystem from "../utils/TheFlysystem";
import VideoHomer from "../utils/VideoHomer";
import CourseVideoDetails from "../contracts/CourseVideoDetailsContract";
import CourseDetails from "../contracts/CourseDetailsContract";
import {
  ChapterDetails,
  VariantDetails,
} from "../contracts/CourseDetailsContract";
import { env, exit } from "node:process";
import DivineScreenCapturer from "../utils/DivineScreenCapturer";
import moment from "moment";
import {
  VideoDetails,
  PostHomingDetails,
} from "../contracts/CourseDetailsContract";
import { performance } from "perf_hooks";
import { VideoHomerDetails } from "../contracts/CourseDetailsContract";

export default class CourseBringer {
  private TheBeautifulWriter: TheBeautifulWriter;
  private CourseHomingBaseTerritory: string = `${rootPath}/downloads/`;
  private DivineScreenCapturer: DivineScreenCapturer;
  private OnlyCourseDivineScreencapture: Boolean;

  constructor(
    private Browser: Promise<Browser | null>,
    private RoadToRideCourseURL?: string,
    private RootPath?: string,
    private CourseMetaDir: string = "courses-json",
    private FasterWalkingThePark?: Boolean
  ) {
    if (this.Browser === null) {
      exit();
    }
    this.RoadToRideCourseURL = RoadToRideCourseURL || env.ROAD_TO_RIDE_FOR_COURSES;
    this.RootPath = rootPath.path;
    this.TheBeautifulWriter = new TheBeautifulWriter();

    this.FasterWalkingThePark =
      FasterWalkingThePark || Boolean(parseInt(env.FASTER_WALKING_THE_PARK));
    this.OnlyCourseDivineScreencapture = Boolean(parseInt(env.ONLY_COURSE_DIVINE_SHOTS_OF_THE_SCREEN));
    this.DivineScreenCapturer = new DivineScreenCapturer("./downloads");

    this.TheBeautifulWriter.info(this.FasterWalkingThePark, this.RoadToRideCourseURL);
  }

  // Filter through unnecessary resources like image font css to avoid loading them if needed
  async routeMiddleware(
    page: Page,
    resourceTypes: string[] = ["image", "stylesheet", "font"]
  ): Promise<Page> {
    if (!this.FasterWalkingThePark) {
      return page;
    }

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (resourceTypes.indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });
    return page;
  }

  public async findCourseDetails(): Promise<
    { src: string; title: string; element: string }[]
  > {
    let browser: Browser | null = await this.Browser;
    const page: Page = await this.routeMiddleware(await browser!.newPage());
    // page.setDefaultNavigationTimeout(0)

    await page.goto(this.RoadToRideCourseURL!, {
      waitUntil: ["networkidle2", "domcontentloaded"],
    });

    const allCourses: {
      src: string;
      title: string;
      element: string;
    }[] = await page.evaluate(() =>
      [...document.querySelectorAll("h3")].map((h3: HTMLHeadingElement) => {
        return {
          src: (<HTMLAnchorElement>h3.closest("a"))?.href!,
          title: h3?.textContent?.replaceAll("\n", "")!,
          element: (<HTMLDivElement>h3?.querySelector("div.inline-block"))
            ?.innerText!,
        };
      })
    );

    this.TheBeautifulWriter.info(__filename, allCourses[1]);

    await writeJSON(`${this.RootPath}/all-courses-list.json`, allCourses, {
      encoding: "utf8",
      spaces: 4,
    });

    await page.close();
    return allCourses;
  }

  public async _useCourseDetailsFromJson(
    courseTitle: string
  ): Promise<CourseDetails> {
    try {
      return await readJSON(
        `${this.RootPath}/${this.CourseMetaDir}/${courseTitle}.json`
      );
    } catch (error) {
      this.TheBeautifulWriter.error("File Reading Error", error.toString());
      return <CourseDetails>{};
    }
  }

  public async _useChapterDetailsFromJson(
    courseTitle: string
  ): Promise<ChapterDetails[]> {
    return (await this._useCourseDetailsFromJson(courseTitle))?.chapters ?? [];
  }

  public async findCoursesAndBringThemHome(
    courses: string[]
  ): Promise<CourseDetails[]> {
    let foundCourses: CourseDetails[] = [];

    this.TheBeautifulWriter.info("The Road Is Here...!!!");

    try {
      let theRoad: Browser | null = await this.Browser;

      this.TheBeautifulWriter.info("Init Landscape!!!");

      const page: Page = await this.routeMiddleware(await theRoad!.newPage());

      this.TheBeautifulWriter.info("Setting eyes to 1080p!!!");

      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      // page.setDefaultNavigationTimeout(0)

      this.TheBeautifulWriter.info("Browser Landscape Init!!!");

      for (const courseURL of courses) {
        const courseTitle: string = await this._findYourBelovedCourseName(page, courseURL);

        this.TheBeautifulWriter.info(courseTitle);

        const course: CourseDetails =
          await this.singleCourseBringerAndHomer(
            page,
            courseURL,
            courseTitle
          );

        if (course.chapters) this.TheBeautifulWriter.info("Adding Course JSON Data!!!");

        await outputFile(
          `${this.RootPath}/${this.CourseMetaDir}/${courseTitle}.json`,
          JSON.stringify(course, null, 4)
        );

        this.TheBeautifulWriter.info(course);

        foundCourses.push(course);

        this.TheBeautifulWriter.info(`JSON Data for ${courseTitle}`);
      }

      this.TheBeautifulWriter.info(
        `JSON Data Stored: "${this.RootPath}/${this.CourseMetaDir}"`
      );

      await page.close();
    } catch (error: any) {
      this.TheBeautifulWriter.error("Error Occurred", error, `${error.toString()}`);
    }
    return foundCourses;
  }

  // Hit the clouds for name
  private async _findYourBelovedCourseName(
    page: Page,
    courseURL: string
  ): Promise<string> {
    await page.goto(courseURL, {
      waitUntil: ["networkidle2", "domcontentloaded"],
    });

    this.TheBeautifulWriter.info(`Bringin this to your home ${courseURL}...`);

    page.waitForSelector("h1[title]");

    const courseTitle = await page.$eval(
      "h1[title]",
      (h1: HTMLHeadingElement) => h1?.textContent
    );

    return new TheFlysystem(courseTitle).sanitizePathName();
  }

  // Hit the clouds for all course related chapters data
  private async _gatherYourFavoriteBookChapters(
    page: Page,
    courseURL: string,
    courseTitle: string
  ): Promise<ChapterDetails[]> {
    const chapters: ChapterDetails[] = <ChapterDetails[]>await page.$$eval(
      "div.chapter",
      (_DivChapter) =>
        [..._DivChapter].map((_Chapter) => {
          const chapterTitle = _Chapter.querySelector("h2")?.textContent;
          // return { title: 'test-title', videos: [] }
          const videos = [..._Chapter.querySelectorAll("a[class='title']")].map(
            (_Video) => {
              if (_Video instanceof HTMLAnchorElement) {
                return {
                  title: _Video.innerHTML,
                  src: _Video.href,
                };
              }
            }
          );
          return {
            title: chapterTitle,
            videos: videos,
          };
        })
    );

    if (!(await pathExists(`${rootPath}/chapters/${courseTitle}.json`))) {
      await outputFile(
        `${rootPath}/chapters/${courseTitle}.json`,
        JSON.stringify(chapters, null, 4)
      );
    }

    return chapters;
  }

  public async singleCourseBringerAndHomer(
    page: Page,
    courseURL: string,
    courseTitle: string
  ): Promise<CourseDetails> {
    const courseScreenshot = await this.DivineScreenCapturer.capture(
      page,
      `Course - ${courseTitle}`
    );

    const courseJson: CourseDetails = {
      title: new TheFlysystem(courseTitle).sanitizePathName(),
      chapters: [],
      successfulStreaming: false,
    };

    this.TheBeautifulWriter.info("Finding Cached Chapters!!!");
    let courseDetailsFromJSON: CourseDetails =
      await this._useCourseDetailsFromJson(courseTitle);

    if (this.OnlyCourseDivineScreencapture) {
      return {
        ...courseDetailsFromJSON,
        hasScreenshot: courseScreenshot?.Path,
      };
    }

    if (courseDetailsFromJSON?.successfulStreaming) {
      this.TheBeautifulWriter.info("Your Favorite Course Has Successful Homing!!! Returning as is!!!");
      this.TheBeautifulWriter.info(courseDetailsFromJSON);
      return courseDetailsFromJSON;
    }

    let chapters: ChapterDetails[] = courseDetailsFromJSON?.chapters;

    if (!chapters?.length) {
      this.TheBeautifulWriter.info("Cached Book Chapters Unavailable!!!");
      this.TheBeautifulWriter.info("Finding Your Book Chapters!!!");
      chapters = await this._gatherYourFavoriteBookChapters(page, courseURL, courseTitle);
      this.TheBeautifulWriter.info("Book Chapters Found!!!");
    }

    let totalErrors: number = 0;

    for (const [chapterIdx, _chapter] of chapters?.entries()) {
      const chapter: ChapterDetails = {
        title: _chapter?.title!,
        videos: [],
        successfulStreaming: false,
      };

      if (chapter?.successfulStreaming) {
        this.TheBeautifulWriter.info(
          "Book Chapter Has Successful Homing!!! Adding to course as is!!!"
        );
        courseJson.chapters.push(chapter);
        continue;
      }

      let totalChapterErrors: number = 0;

      for (const [videoIdx, video] of _chapter?.videos?.entries()) {
        try {
          if (video?.successfulStreaming) {
            this.TheBeautifulWriter.info(
              "Book Chapter Single Video Has Successful Homing!!! Adding to book chapter as is!!!"
            );
            chapter.videos.push(video);
            continue;
          }
          this.TheBeautifulWriter.info(
            "ChapterID.VideoID And Video: ",
            `${chapterIdx}.${videoIdx}`,
            video
          );

          this.TheBeautifulWriter.info(
            `Currently Homing => Beloved Book Course-> ${courseTitle}, \n Vid: ${video?.title}, \n URL: ${video?.src}`
          );

          let variants: VariantDetails[] = video?.variants;
          this.TheBeautifulWriter.info("Cached Variants!!!", variants);

          const videoVariantFinder = new VideoVariantsFinder(page, variants);

          if (
            !variants?.length ||
            !moment(video?.expiry).isSameOrAfter(moment())
          ) {
            this.TheBeautifulWriter.info("Cache Unavailable ---- Finding Variants!!!");
            variants = await videoVariantFinder.find(video?.src);
            this.TheBeautifulWriter.info("Found Variants!!!", variants);
          }

          const qualityChosen: VariantDetails =
            videoVariantFinder.chooseVariantBasedOnPreferredQuality();

          this.TheBeautifulWriter.info("Your Eye Pleasing Quality Selected => ", qualityChosen?.quality);

          let expiry = moment().add(1, "week");
          let fetchedAt = moment();

          const videoDetails: VideoDetails = {
            title: video?.title,
            src: video?.src,
            variants: variants,
            expiry: expiry.format("X"),
            expiryForHumans: expiry.format("LLL"),
            fetchedAt: fetchedAt.format("X"),
            fetchedAtForHumans: fetchedAt.format("LLL"),
            successfulStreaming: false,
          };

          this.TheBeautifulWriter.info("Video Details!!!", videoDetails);

          this.TheBeautifulWriter.info("Homing Video!!!");
          const homingDetails: PostHomingDetails = await this.homeTheVideo(
            {
              videoUrl: qualityChosen?.url,
              courseTitle: courseTitle,
              chapterTitle: _chapter?.title,
              videoTitle: video?.title,
              chapterIdx,
              videoIdx,
              quality: qualityChosen?.quality,
              type: qualityChosen?.type,
            }
          );
          this.TheBeautifulWriter.info("Finished Homing!!!");

          this.TheBeautifulWriter.info("Adding to Book Chapters!!!");
          chapter.videos.push({
            ...videoDetails,
            streamingDetails: homingDetails,
            createdAtForHumans:
              video?.createdAtForHumans ?? moment().format("LLL"),
            lastUpdatedAtForHumans: moment().format("LLL"),
            successfulStreaming: true,
          });
          this.TheBeautifulWriter.info("Added to Book Chapters!!!");
        } catch (err) {
          this.TheBeautifulWriter.error("Error Happened --> :( ", video?.title, err);
          this.TheBeautifulWriter.error(
            `Error in Course --> ${courseTitle} -> ${video?.title}`
          );
          this.TheBeautifulWriter.info("Adding to Book Chapters with Error!!!");
          chapter.videos.push({
            title: video?.title,
            src: video?.src,
            err: err.toString(),
            errAtForHumans: moment().format("LLL"),
            variants: null,
            createdAtForHumans:
              video?.createdAtForHumans ?? moment().format("LLL"),
            lastUpdatedAtForHumans: moment().format("LLL"),
            successfulStreaming: false,
          });
          totalChapterErrors++;
          totalErrors++;
          this.TheBeautifulWriter.info(
            "Errors so far ====> ",
            `Total: ${totalErrors}, Chapterwise: ${totalChapterErrors}`
          );
        }
      }

      courseJson.chapters.push({
        ...chapter,
        createdAtForHumans:
          chapter?.createdAtForHumans ?? moment().format("LLL"),
        lastUpdatedAtForHumans: moment().format("LLL"),
        successfulStreaming: totalChapterErrors === 0,
        errors: totalChapterErrors,
      });
    }

    this.TheBeautifulWriter.info("Entire Favorite Book Course!!!", courseJson);

    if (totalErrors === 0) {
      courseJson.successfulStreaming = true;
    }
    return {
      ...courseJson,
      createdAtForHumans:
        courseDetailsFromJSON?.createdAtForHumans ?? moment().format("LLL"),
      lastUpdatedAtForHumans: moment().format("LLL"),
      errors: totalErrors,
    };
  }

  public async homeTheVideo({
    courseTitle,
    chapterTitle,
    videoTitle,
    chapterIdx,
    videoIdx,
    videoUrl,
    quality,
    type,
  }: CourseVideoDetails): Promise<PostHomingDetails> {
    try {
      this.TheBeautifulWriter.info(
        `Homing Video At --> \n ${chapterTitle} ${chapterIdx}.${videoIdx} ${videoTitle}`
      );

      const homingPath = `${this.CourseHomingBaseTerritory}/${courseTitle}/${chapterIdx}-${chapterTitle}`;

      this.TheBeautifulWriter.info("Home Path!!!", homingPath);

      const fileName = new Stringer(videoTitle).sensitize();

      this.TheBeautifulWriter.info("Filename!!!", fileName);

      const homable = new TheFlysystem(homingPath);

      const finalHomingPath = homable.sanitizePathName();

      this.TheBeautifulWriter.info("Final home path!!!", finalHomingPath);

      await homable.checkIfExistsOrCreate();

      const monitorStart = performance.now();
      this.TheBeautifulWriter.info("Video Homer Attached!!!");

      const streamer: VideoHomerDetails = await new VideoHomer(
        videoUrl,
        `${finalHomingPath}/${chapterIdx}.${videoIdx} ${fileName}-${quality}.mp4`,
        type
      ).stream();

      this.TheBeautifulWriter.info("Video Homer Detached!!!");

      const streamedIn = performance.now() - monitorStart;

      this.TheBeautifulWriter.info(
        `Homing Completed For --> ${chapterIdx}.${videoIdx} ${videoTitle} Quality:${quality}`
      );

      return {
        fileName: fileName,
        downloadPath: finalHomingPath,
        selectedQuality: quality,
        streamingURLType: type,
        chapterID: chapterIdx,
        videoID: videoIdx,
        fileSize: streamer?.fileSize,
        downloadedIn: Math.round(streamedIn / 1000).toString(),
        fileExists: streamer?.fileExists,
      };
    } catch (error: any) {
      this.TheBeautifulWriter.error(
        __filename,
        error,
        courseTitle,
        chapterTitle,
        videoTitle,
        chapterIdx,
        videoIdx,
        videoUrl
      );
      this.TheBeautifulWriter.error(
        `${error.toString()} Course --> ${courseTitle}  Video --> ${chapterIdx}.${videoIdx} ${videoTitle}`
      );
      this.TheBeautifulWriter.error(
        error,
        `Error On Video --> ${chapterIdx}.${videoIdx} ${videoTitle}`
      );
      this.TheBeautifulWriter.debug(__filename, error);
      throw new Error("Homing Error Occurred!!! " + error.toString());
    }
  }
}
