const {transports, createLogger, format} = require('winston');
const {printf} = format;
require('winston-daily-rotate-file');

/* logger */
// for general purpose
const transportRotate = new transports.DailyRotateFile({
    filename: 'logs/application_%DATE%.log',
    datePattern: 'YYYY-MM',     // monthly
    maxSize: '10m',
    maxFiles: 10,
    level: 'info',
    handleExceptions: true
});

// for requests
const transportRotateRequests = new transports.DailyRotateFile({
    filename: 'logs/requests_%DATE%.log',
    datePattern: 'WW',  // weekly
    maxSize: '20m',
    maxFiles: 20,
    level: 'http',
    handleExceptions: true
});

// custom formatting
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
});

const logger = createLogger({
    format: format.combine(
        format.timestamp({format:"YYYY-MM-DD hh:mm:ss A"}),
        myFormat
    ),
    transports: [
        // new transports.Console(),
        // new transports.File({ filename: 'logs/combined.log'}),
        transportRotate,
        transportRotateRequests
    ],
    exitOnError: false
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console());
}
/* end logger */

module.exports = logger;