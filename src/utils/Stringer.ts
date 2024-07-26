export default class Stringer {
  constructor(private Str: string) {}

  public sensitize(): string {
    return this.slugify().capitalize().get()
  }

  public slugify(): this {
    this.Str = this.Str.toString() // Cast to string (optional)
      .normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
      // .toLowerCase() // Convert the string to lowercase letters
      .trim() // Remove whitespace from both sides of a string (optional)
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/\-/g, ' ')
    return this
  }

  public capitalize(regex: RegExp = /[_-]/g, replacer: string = ' '): this {
    const sanitized = this.Str.replace(regex, replacer)
    this.Str = sanitized.charAt(0).toUpperCase() + sanitized.slice(1)
    return this
  }

  public get(): string {
    return this.Str
  }
}
