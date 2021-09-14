// const { format, createLogger, transports } = require('winston');
// const { timestamp, combine, errors, json, printf, splat } = format;


// function buildProdLogger() {
//     return createLogger({
//         format: combine(
//             timestamp(),
//             errors({ stack: true }),
//             splat(),
//             json(),
//             printf(
//                 info => `{${info.timestamp} [${info.level}]: ${info.message}}`
//             )
//         ),
//         defaultMeta: { service: 'shoppingcart-service' },
//         transports: [
//             new transports.Console(),
//             new transports.File({
//                 filename: 'logs/shoppingcart-logs.log'
//             })
//         ],
//         exitOnError: false
        
//     });
// }

const winston = require('winston')
const { format, transports } = winston
const path = require('path');
require('winston-mongodb');

const logFormat = format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`)

function buildProdLogger() {
    return winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.label({ label: path.basename(process.mainModule.filename) }),
    format.timestamp(),
    // Format the metadata object
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    new transports.MongoDB({
        db : 'mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-carts?retryWrites=true&w=majority',
        useUnifiedTopology: true ,
        collection: 'logs'
    })
  ],
  exitOnError: false
})
}

module.exports = buildProdLogger;