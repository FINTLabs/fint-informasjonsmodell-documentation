import chalk from 'chalk';

/**
 * Human friendly error messages.
 * Because understanding is important!
 */
export const ERROR_MESSAGES: any = {
  EACCES: `${chalk.red.bold('Permission denied!')}

${chalk.cyan.underline('Tip:')}
     You could try running with elevated privileges.\n\n`,

  EADDRINUSE: `${chalk.red.bold('Address is in use!')}

${chalk.cyan.underline('Tip:')}
     Check if anything else occupies ${chalk.yellow.bold('port 3000')} on your machine.\n\n`
};
