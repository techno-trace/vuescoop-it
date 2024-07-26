import {Logger as LoggerContract, createLogger, transports, format, Logform} from 'winston'
import appRoot from 'app-root-path'
import { FileTransportOptions, ConsoleTransportOptions } from 'winston/lib/winston/transports'
import { env } from 'node:process';

interface TheWritables extends FileTransportOptions, ConsoleTransportOptions {
  level: string
  handleExceptions: boolean
  json: boolean
  colorize: boolean
  stderrLevels?: string[]
  format: Logform.Format

}

interface Optionables {
  console: TheWritables
  fresh: TheWritables
  file: TheWritables
  html: TheWritables
}


export default class TheBeautifulWriter {
  private Options!: Optionables
  private TheBeautifulWriter: LoggerContract

  constructor(private Env: string = env.NODE_ENV || 'development') {
    this._initializeOptions()
    this.TheBeautifulWriter = createLogger({
      level: this.Env === 'development' ? 'debug' : 'info',
      transports: [
        new transports.Console(this.Options.console),
        new transports.File(this.Options.fresh),
        new transports.File(this.Options.file),
      ],
    })
  }

  private _initializeOptions() {
    this.Options = {
      console: {
        level: 'debug',
        handleExceptions: true,
        json: true,
        colorize: true,
        stderrLevels: ['error'],
        format: format.combine(
          format.prettyPrint(),
          format.splat(),
          format.colorize(),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf(this._writeinfo)
        ),
      },
      file: {
        level: 'debug',
        filename: `${appRoot.path}/logs/${new Date()
          .toISOString()
          .slice(0, 15) // "2024-01-13_OClock_13-5" from "2024-01-13_OClock_13-54-58.918Z"
          .replace('T','_OClock_')
          .replace(/[:]/g, '-')}.log`, // Date=YYYY-MM-DD
        handleExceptions: true,
        json: true,
        maxsize: 1048576, // 1MB
        maxFiles: 5,
        colorize: false,
        format: format.combine(
          format.prettyPrint(),
          format.splat(),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf(this._writeinfo)
        ),
      },
      fresh: {
        level: 'debug',
        filename: `${appRoot.path}/logs/fresh.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 30,
        colorize: false,
        format: format.combine(
          format.prettyPrint(),
          format.splat(),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf(this._writeinfo)
        ),
        options: { flags: 'w' }, // Disable appending clean every log
      },
      html: {
        level: 'info',
        filename: `${appRoot.path}/logs/${new Date()
          .toISOString()
          .slice(0, 10)}.html`, // Date=YYYY-MM-DD
        handleExceptions: false,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 365,
        colorize: false,
        format: format.combine(
          // format.prettyPrint(),
          format.splat(),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf((info) => info.message)
        ),
        options: { flags: 'w' }, // Disable appending clean every log
      },
    }
  }

  private _getCircularReplacer<T, V>(key: T, value: V) {
    const seen = new WeakSet()
    return (_: T, value: V) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'
        }
        seen.add(value)
      }
      return value
    }
  }

  private _writeinfo(info: Logform.TransformableInfo) {

    try {
      if (typeof info.message === 'object') {
        info.message = JSON.stringify(info.message, this._getCircularReplacer, 4)
      }  
    } catch (error) {
      console.error("Error stringifying info!", error)
      console.dir(info)
    }
    
    return `\n[${info.timestamp}] ${info.level} ==> \t ${info.message} \n`
  }

  public info(...message: any[]) {
    this.TheBeautifulWriter.info({...message})
  }
  public error(...message: any[]) {
    this.TheBeautifulWriter.error({...message})
  }
  public warning(...message: any[]) {
    this.TheBeautifulWriter.warning({...message})
  }
  public debug(...message: any[]) {
    this.TheBeautifulWriter.debug({...message})
  }
}
