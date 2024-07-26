import { env } from "node:process";
import moment from "moment";
import rootPath from "app-root-path";
import { pathExists, readJSON, writeJSON } from "fs-extra";
import TheBeautifulWriter from "../utils/TheBeautifulWriter";
import { Protocol } from "puppeteer";
import TheFlysystem from "../utils/TheFlysystem";

export default class CookiesBakery {
  private CookiesDirectory: string;
  private CookiesFullPath: string;
  private TheBeautifulWorker: TheBeautifulWriter;
  private CookiesBakeryCache: Protocol.Network.CookieParam[];
  constructor(
    private RootPath?: string,
    private CookiesName?: string,
    private SupportCookies?: Boolean
  ) {
    this.TheBeautifulWorker = new TheBeautifulWriter();
    this.SupportCookies =
      SupportCookies || Boolean(parseInt(env.DO_YOU_LIKE_COOKIES));
    this.CookiesName = CookiesName || env.WHAT_COOKIES_DO_YOU_LIKE || "cookies.json";
    this.RootPath = rootPath.path;
    const today = moment().format("dddd_MMMM_Do_YYYY");
    this.CookiesName = `${today}__${this.CookiesName}`;
    this.CookiesDirectory = `${this.RootPath}/cookies`;
    this.CookiesFullPath = `${this.CookiesDirectory}/${this.CookiesName}`;
  }

  public weAreInBusiness(): Boolean {
    return this.SupportCookies;
  }

  public async areThere(): Promise<boolean> {
    try {
      if (this.weAreInBusiness()) {
        return await pathExists(this.CookiesFullPath);
      }
    } catch (error) {
      return false;
    }
  }

  public async gimmeThose(): Promise<Protocol.Network.CookieParam[]> {
    try {
      if (this.weAreInBusiness()) {
        this.CookiesBakeryCache = await readJSON(this.CookiesFullPath, "utf8");
      }
    } catch (error) {
      this.TheBeautifulWorker.error("Cookies Not There!!!");
    }
    return this.CookiesBakeryCache;
  }

  public async shouldBakeSome(
    cookies: Protocol.Network.CookieParam[]
  ): Promise<void> {
    if (this.weAreInBusiness()) {
      this.CookiesBakeryCache = cookies;
      this.TheBeautifulWorker.info("saving cookies to json!!");

      await new TheFlysystem(this.CookiesDirectory).checkIfExistsOrCreate();

      await writeJSON(this.CookiesFullPath, cookies, {
        spaces: 4,
        encoding: "utf8",
      });
    }
  }
}
