import TheFlysystem from "./TheFlysystem";
import { Page } from "puppeteer";
import { env } from "node:process";
import TheBeautifulWriter from "./TheBeautifulWriter";

export default class DivineScreenCapturer {
  private TheBeautifulWriter: TheBeautifulWriter;
  constructor(
    private GeneralDivineScreenCapturePath: string = "./screenshots",
    private DivineScreenCaptureEnabled?: Boolean,
    private CurrentPath?: string
  ) {
    this.DivineScreenCaptureEnabled =
      DivineScreenCaptureEnabled || Boolean(parseInt(env.DIVINE_SHOTS_OF_THE_SCREEN));
    this.CurrentPath = this.GeneralDivineScreenCapturePath;
    this.TheBeautifulWriter = new TheBeautifulWriter();
  }

  public setCurrentPagePath(NewPath: string) {
    // Ex: /downloads/Course-Title/Chapter for custom screenshot under any course or chapter
    this.CurrentPath = NewPath;
  }

  public async capture(Page: Page, Name: string): Promise<{Page: Page, Path?: string}> {
    if (this.DivineScreenCaptureEnabled) {
      try {
        Name = new TheFlysystem(Name).sanitizePathName();
        const filesystem = new TheFlysystem(
          this.CurrentPath ?? this.GeneralDivineScreenCapturePath
        );
        const filepath: string = await filesystem.checkIfExistsOrCreate();
        this.TheBeautifulWriter.info(`Capturing Screenshot == ${filepath}/${Name}.png`);
        await Page.screenshot({ path: `${filepath}/${Name}.png` });
        this.TheBeautifulWriter.info("Screenshot Taken!!!");

        return {Page, Path: `${filepath}/${Name}.png`};
      } catch (error) {
        this.TheBeautifulWriter.info("Screenshot Could not be Captured!!!");
        this.TheBeautifulWriter.info(error.toString());
      }

      return {Page, Path: null}
    }
  }
}
