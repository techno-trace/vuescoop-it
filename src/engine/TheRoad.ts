import {launch, Browser} from 'puppeteer'
import TheBeautifulWriter from '../utils/TheBeautifulWriter'
import { env } from 'node:process';

export default class TheRoadInstance {
  private TheBeautifulWriter: TheBeautifulWriter

  constructor(private Headless?: any) {
    this.Headless = Headless || env.I_WILL_NOT_SHOW_YOU_THE_LIVE_SCREEN
    this.TheBeautifulWriter = new TheBeautifulWriter()
  }

  public async start(): Promise<Browser|null> {
    try {
      this.TheBeautifulWriter.info('Road Init ===>')

      return await launch({
        headless: this.Headless,
        args: ['--disable-setuid-sandbox'],
      })
    } catch (error) {
      this.TheBeautifulWriter.error(error)
      this.TheBeautifulWriter.error('Failed to init a road instance :( ')
      return null
    }
  }
}
