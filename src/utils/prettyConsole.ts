const chalk = require("chalk");
import moment from "moment";

const newConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

console.log = (...args: any[]) =>
  newConsole.log(
    chalk.bgCyan.bold(moment().format("LLL") + " LOG:- "),
    chalk.bgCyan.bold(...args)
  );
console.info = (...args: any[]) =>
  newConsole.info(
    chalk.bgMagenta.bold(moment().format("LLL") + " INFO:- "),
    chalk.bgMagenta.bold(...args)
  );
console.warn = (...args: any[]) =>
  newConsole.warn(
    chalk.bgYellow.bold(moment().format("LLL") + " WARN:- "),
    chalk.bgYellow.bold(...args)
  );
console.error = (...args: any[]) =>
  newConsole.error(
    chalk.bgRed.bold(moment().format("LLL") + " ERROR:- "),
    chalk.bgRed.bold(...args)
  );

  export default console