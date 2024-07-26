import { Browser, Page } from "puppeteer";
import DivineScreenCapturer from "../utils/DivineScreenCapturer";
import { env, exit } from "node:process";
import CookiesBakery from "./CookiesBakery";
import TheBeautifulWriter from '../utils/TheBeautifulWriter';

export default class RoadToRideProvider {
  private DivineScreenCapturer: DivineScreenCapturer;
  private RoadToRideAttempts: number = 0;
  private CookiesStore: CookiesBakery
  private TheBeautifulWriter: TheBeautifulWriter
  constructor(
    private Browser: Promise<Browser | null>,
    private Username?: string,
    private Password?: string,
    private RoadToRideRoute?: string,
    private UsernameField: string = "input[type=text]",
    private PasswordField: string = "input[type=password]",
    private RoadToRideRetries?: number
  ) {
    if (this.Browser === null) {
      exit();
    }
    this.TheBeautifulWriter = new TheBeautifulWriter();
    this.Username = Username || env.YOUR_MEN_IN_BLACK_EMAIL;
    this.Password = Password || env.YOUR_MEN_IN_BLACK_PASSWORD;
    this.RoadToRideRoute = RoadToRideRoute || env.ROAD_TO_RIDE;
    this.RoadToRideRetries = RoadToRideRetries || Number(env.HOMING_RETRIES) || 2;
    this.DivineScreenCapturer = new DivineScreenCapturer();
    this.CookiesStore = new CookiesBakery();
    this.TheBeautifulWriter.info("Cookies Info", this.CookiesStore.weAreInBusiness())
  }

  public async startRiding(): Promise<void> {
    this.RoadToRideAttempts++;
    const browser: Browser = await this.Browser;
    const page: Page = await browser.newPage();

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    if (!this.CookiesStore.weAreInBusiness() || !(await this.CookiesStore.areThere())) {
      this.TheBeautifulWriter.info("Cookies: Not In Business Or Not There!!!")
      await this._ride(page);
      return
    }
    
    const cookies = await this.CookiesStore.gimmeThose();
    this.TheBeautifulWriter.info("Cookies: Are There!!!", cookies)

    if (cookies) {
      this.TheBeautifulWriter.info("Feeding the cookies to the browser!!!")
      await page.setCookie(...cookies);
      return
    }
    
    await this._ride(page);
  }

  private async _ride(page: Page): Promise<void> {
    try {
      this.TheBeautifulWriter.info("Rode To Ride using User.....", this.Username);

      await page.goto(this.RoadToRideRoute!, {
        waitUntil: ["networkidle2", "domcontentloaded"],
      });
      await page.type(this.UsernameField, this.Username!);
      await page.type(this.PasswordField, this.Password!);
      await this.DivineScreenCapturer.capture(page, "RoadToRidePage");

      await Promise.all([
        page.click(`button.btn[tabindex]`),
        page.waitForNavigation({
          waitUntil: ["networkidle2", "domcontentloaded"],
        }),
      ]);

      await this.CookiesStore.shouldBakeSome(await page.cookies())

      await this.DivineScreenCapturer.capture(page, "RoadToRideRedirect");

      const pageClosure = setTimeout(async () => {
        await page.close();
        this.TheBeautifulWriter.info("Auth Page Closure Status!!!", page.isClosed())
        this.TheBeautifulWriter.info("Clearing Timeout!!!")
        this.TheBeautifulWriter.info(pageClosure)
        clearTimeout(pageClosure)
      }, 2000)

      this.TheBeautifulWriter.info("Road to ride success!, Redirected to Profile", "Auth Page Status : " + page.isClosed());
      
    } catch (error: any) {
      if (this.RoadToRideAttempts <= this.RoadToRideRetries) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        this.TheBeautifulWriter.info(
          "Retrying Logging In for ya 🦄 ---> 1.2.3.... Zoom we go!"
        );
        await this.startRiding();
      } else {
        this.TheBeautifulWriter.error(
          error,
          `Attempted to home : ${this.RoadToRideAttempts} times`
        );
      }
    }
  }
}
