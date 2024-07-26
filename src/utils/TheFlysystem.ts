import { existsSync, mkdirSync, readdirSync } from "fs-extra";
import { platform } from "node:process";

export default class TheFlysystem {
  constructor(private Dir: string) {}
  public async getFiles(): Promise<string[]> {
    if (!existsSync(this.Dir)) {
      console.error("Directory doesnot exist => ", this.Dir);
      return [];
    }

    return readdirSync(this.Dir);
  }

  public async checkFileExists(): Promise<boolean> {
    return !!existsSync(this.Dir);
  }

  // Windows doesn't like special characters in folder names
  public sanitizePathName(): string {
    const replacementMap: Map<
      RegExp,
      {
        replacement: string;
        apply: boolean;
      }
    > = new Map([
      [/[\/\/]+/g, { replacement: "/", apply: true }], // all platforms
      [/:(?!\\)/g, { replacement: "-", apply: platform === "win32" }], // windows
      [/[*?"|<>]+/g, { replacement: "-", apply: platform === "win32" }], // windows
      [/[<>:;,."|+=%$#@!~?*]+/g, { replacement: "-", apply: platform !== "win32" }] // others
    ]);

    for (const [pattern, { replacement, apply }] of replacementMap.entries()) {
      // console.debug("\nSanitizer!!!", pattern, replacement, apply, this.Dir)
      if (apply) {
        this.Dir = this.Dir.replace(pattern, replacement);
      }
      // console.debug("This Dir!!!", this.Dir)
    }

    return this.Dir;
  }

  public async checkIfExistsOrCreate(
    recursive: boolean = true
  ): Promise<string> {
    if (!existsSync(this.Dir)) {
      mkdirSync(this.Dir, { recursive });
    }
    return this.Dir;
  }
}
