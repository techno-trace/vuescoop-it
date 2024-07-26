import { request, RequestOptions, Agent } from "https";
import { createWriteStream, unlink, pathExists, stat } from "fs-extra";
import { SingleBar } from "cli-progress";
import { cyan } from "ansi-colors";
import TheBeautifulWriter from "./TheBeautifulWriter";
import UserAgent from "user-agents";
import { HomingURLType } from "../types/HomingURLType";
import CookiesBakery from "../engine/CookiesBakery";
import { VideoHomerDetails } from "../contracts/CourseDetailsContract";

export default class VideoHomer {
  private ProgressBar: SingleBar;
  private TheBeautifulWriter: TheBeautifulWriter;
  private HomingBytes: number = 0;
  private RequestData: RequestOptions;
  private ParsedURL?: URL;
  private CookiesStore: CookiesBakery;

  constructor(
    private StreamingURL: string,
    private Destination: string,
    private UrlType: HomingURLType = "legacy-streaming-url"
  ) {
    this.ProgressBar = new SingleBar({
      format:
        "Download Progress |" +
        cyan("{bar}") +
        "| {percentage}% || {value}/{total} MB || ETA: {eta}s",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    });
    this.TheBeautifulWriter = new TheBeautifulWriter();
    this.UrlType = UrlType;
    this.ParsedURL = new URL(this.StreamingURL);

    this.CookiesStore = new CookiesBakery();
    this.TheBeautifulWriter.info(
      this.UrlType,
      this.StreamingURL,
      this.Destination,
      this.ParsedURL
    );
  }

  public async stream(): Promise<VideoHomerDetails> {
    return await new Promise(async (resolve, reject) => {
      this.TheBeautifulWriter.info("DESTINATION!!!", this.Destination);

      if (await pathExists(this.Destination)) {
        this.TheBeautifulWriter.info("File Exists, Rejecting!!!");
        reject({
          fileSize: (await stat(this.Destination)).size * (1024 * 1024) + " MB",
          fileExists: true,
        });
        return;
      }

      this.RequestData = {
        hostname: this.ParsedURL?.hostname,
        port: 443,
        path: this.ParsedURL?.pathname + this.ParsedURL?.search,
        method: "GET",
      };

      if (this.UrlType === "download-button-url") {
        this.TheBeautifulWriter.info("Trying to read cookies!!!");
        const cookies = await this.CookiesStore.gimmeThose();

        this.RequestData = {
          ...this.RequestData,
          headers: {
            "user-agent": new UserAgent({
              deviceCategory: "mobile",
            }).toString(),
            cookie: cookies.length
              ? cookies
                  .map((cookie) => `${cookie?.name}=${cookie?.value}`)
                  .join("; ")
              : "",
          },
          agent: new Agent({ keepAlive: true }),
        };
      }

      this.TheBeautifulWriter.info("DATA FOR STREAMING!!!", this.RequestData);

      const req = request(this.RequestData, (response) => {
        if (response.statusCode === 200) {
          const totalBytes = parseInt(response.headers["content-length"]!, 10);
          const totalMegaBytes = Math.round(totalBytes / (1024 * 1024));

          this.ProgressBar.start(totalMegaBytes, 0);
          const file = createWriteStream(this.Destination, { flags: "wx" });

          response.on("data", (chunk) => {
            this.HomingBytes += chunk.length;
            const downloadedMB = Math.round(
              this.HomingBytes / (1024 * 1024)
            );
            this.ProgressBar.update(downloadedMB, {
              total: downloadedMB,
              percentage: 100,
            });
          });

          file.on("finish", () => {
            this.ProgressBar.update({
              total: Math.round(file.bytesWritten / (1024 * 1024)),
              percentage: 100,
            });
            this.ProgressBar.stop();
            file.close();
            this.TheBeautifulWriter.info("HOMED VIDEO!!!");
            resolve({
              fileSize: Math.round(file.bytesWritten / (1024 * 1024)) + " MB",
              fileExists: false,
            });
          });
          file.on("error", (err: NodeJS.ErrnoException) => {
            file.close();
            this.ProgressBar.stop();
            req.end();
            this.TheBeautifulWriter.debug("FILE EXIST ERROR!!!", err);
            if (err.code === "EEXIST") reject("File already exists");
            else unlink(this.Destination, () => reject()); // Delete temp file
          });

          response.pipe(file);
        } else if (response.statusCode === 302 || response.statusCode === 301) {
          this.TheBeautifulWriter.info("Server Redirect!!!", response.statusCode);
          // Follow redirects, only a 200 is okay to proceed
          this.StreamingURL = response.headers.location!;
          this.stream().then(() =>
            resolve({
              fileSize: null,
              fileExists: false,
            })
          );
        } else {
          this.TheBeautifulWriter.info("Server Rejected!!!", response.statusCode);
          reject(
            `Server responded with ${response.statusCode}: ${response.statusMessage}`
          );
        }
      });

      req.on("error", (err: NodeJS.ErrnoException) => {
        this.ProgressBar.stop();
        req.end();
        this.TheBeautifulWriter.info("Request Error!!!", err.message);
        reject(err.message);
      });

      req.setTimeout(3000, () => {
        this.TheBeautifulWriter.info("Timed out for response!!!");
      });

      req.end();
    });
  }
}
