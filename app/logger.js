// log setup
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'debug',
  // You can also comment out the line above and uncomment the line below for JSON format
  format: format.simple(),
  transports: [new transports.Console()],
});

module.exports = { logger, transports };
