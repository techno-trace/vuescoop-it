import type { Page, Frame, ElementHandle } from "puppeteer";
import TheBeautifulWriter from "../utils/TheBeautifulWriter";
import fse from "fs-extra";
import rootPath from "app-root-path";
import { env } from "node:process";
import { v4 as uuidv4 } from "uuid";
import { VariantDetails } from '../contracts/CourseDetailsContract';
import {
  VideoVariantExtractedJson,
  VideoVariant,
  HomeLink,
} from "../contracts/VideoVariantContract";

export default class VideoVariantsFinder {
  private TheBeautifulWriter: TheBeautifulWriter;
  private FindingAttempts: number = 0;
  private ForceNewStructure: boolean;
  constructor(
    private Page: Page,
    private VideoVariants: VideoVariant[] = [],
    private Quality?: string,
    private RootPath: string = rootPath.path,
    private FindingRetries?: number
  ) {
    this.VideoVariants = VideoVariants
    this.Quality = Quality || env.YOUR_EYE_LIKES_THE_QUALITY || "1080p";
    this.FindingRetries = FindingRetries || parseInt(env.HOMING_RETRIES) || 2;
    this.TheBeautifulWriter = new TheBeautifulWriter();
    this.ForceNewStructure = Boolean(parseInt(env.FORCE_NEW_DIVINE_STRUCTURE));
  }

  async find(_url: string): Promise<VideoVariant[]> {
    await this.Page.goto(_url, {
      waitUntil: ["networkidle2", "domcontentloaded"],
    });
    
    if (!this.ForceNewStructure) {
      this.FindingAttempts++;
      const elementHandle: ElementHandle<Element> | null = await this.Page.$(
        "iframe[src]"
      );
      const iFrameContent: Frame | null = await elementHandle!.contentFrame();
      const content: string = await iFrameContent!.content();
      // this.TheBeautifulWriter.info(content)

      try {
        // this.TheBeautifulWriter.info(typeof content)
        const playerConfigJsonStart: string = content?.split(
          `<script>window.playerConfig = `
        )?.[1];
        const playerConfigJsonEnd: string =
          playerConfigJsonStart?.split(`</script>`)?.[0];
        const playerConfigExtractedJson: VideoVariantExtractedJson =
          JSON.parse(playerConfigJsonEnd);
        // this.TheBeautifulWriter.info(playerConfigExtractedJson);
        this.VideoVariants =
          playerConfigExtractedJson?.request?.files?.progressive;

        if (this.VideoVariants.length) {
          // DESC order of quality 1080p > 720p
          this.VideoVariants = this.VideoVariants.sort(
            (v1, v2) =>
              parseInt(v2.quality.slice(0, -1)) -
              parseInt(v1.quality.slice(0, -1))
          );
        }
        // this.TheBeautifulWriter.info(videoVariants);
        this.TheBeautifulWriter.info(
          "Video Variants from old structure ==> ",
          this.VideoVariants
        );
      } catch (err) {
        console.debug(
          "Finding Attempts! ==> ",
          this.FindingAttempts,
          this.FindingRetries
        );
        if (this.FindingAttempts <= this.FindingRetries!) {
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
          this.TheBeautifulWriter.info(
            "Retrying finding the video for ya 🦄 ---> 1.2.3.... Zoom we go!"
          );
          await this.find(_url);
        } else {
          console.error(
            "homer video variants finding error!, might be changes in dom or json structure!",
            err
          );
          const dateTimeFormat = new Date()
            .toISOString()
            .replace(/:/g, "-")
            .replace(/\..+/, "");
          await fse.outputFile(
            `${this.RootPath}/logs/error-on-parsing-${dateTimeFormat}.html`,
            content
          );
        }
      }
    }

    const verifyDesiredQuality: VariantDetails = this.chooseVariantBasedOnPreferredQuality()

    if (!this.VideoVariants.length || verifyDesiredQuality?.quality !== this.Quality) {
      this.TheBeautifulWriter.info("Trying with new structure!!", verifyDesiredQuality?.quality);
      return await this._findWithinNewStructure();
    }

    return this.VideoVariants;
  }

  private async _findWithinNewStructure(): Promise<VideoVariant[]> {
    try {
      const tagContainingHomingLinks: string = "div.locked-feature";

      this.TheBeautifulWriter.info(
        "Waiting for the divine element to appear!!!",
        tagContainingHomingLinks
      );

      await this.Page.waitForSelector(tagContainingHomingLinks);

      const homeLinks: HomeLink[] = <HomeLink[]>(
        await this.Page.$eval(
          tagContainingHomingLinks,
          (element: HTMLDivElement) => {
            if (
              (<HTMLDivElement>element.firstChild).innerText.includes(
                "HOME THE VIDEO"
              )
            ) {
              return Array.from(element.querySelectorAll("a")).map(
                (el: HTMLAnchorElement) => ({
                  ["quality"]: el.innerText,
                  ["url"]: el.href,
                  ["type"]: "download-button-url",
                })
              );
            }
          }
        )
      );

      this.TheBeautifulWriter.info("Homing Links!!!", homeLinks);

      homeLinks.forEach((dl: HomeLink, idx: number) => {
        this.VideoVariants.push({
          quality: dl.quality === "HD" ? "1080p" : "720p",
          url: dl.url,
          id: uuidv4(),
          type: dl.type,
        });
      });

      if (this.VideoVariants.length) {
        // DESC order of quality 1080p > 720p
        this.VideoVariants = this.VideoVariants.sort(
          (v1, v2) =>
            parseInt(v2.quality.slice(0, -1)) -
            parseInt(v1.quality.slice(0, -1))
        );
      }

      this.TheBeautifulWriter.info(
        "Video Variants from new structure!!!",
        this.VideoVariants
      );
    } catch (error) {
      console.error(
        "homer video variants finding error!, might be changes in new structure!",
        error
      );
    }

    if (!this.VideoVariants.length) {
      throw new Error(
        "Could not find video variants, unable to proceed with homing!!!"
      );
    }

    return this.VideoVariants;
  }


  public chooseVariantBasedOnPreferredQuality(): VariantDetails {
    return this.VideoVariants.reduce(
      (
        accumulator: VariantDetails,
        curVariant: VariantDetails,
        curIdx: number,
        variantsList: VariantDetails[]
      ) => {
        if (!accumulator?.quality) {
          accumulator =
            curVariant.quality === this.Quality
              ? curVariant
              : variantsList[curIdx] ?? accumulator;
          // If lower resolution option isn't available then
          // default to lowest possible assuming sorted list by desc resolution
        }

        return accumulator;
      },
      <VariantDetails>{}
    );
  }
}
