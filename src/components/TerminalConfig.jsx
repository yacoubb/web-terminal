const chalk = require('chalk');
const chalkCtx = new chalk.Instance({ level: 2 });

export const defaultName = '▲';
export const linePrompt = (name) => `${chalkCtx.red.bold(name + ' ~')} $`;
