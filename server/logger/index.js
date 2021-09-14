const buildProdLogger = require('./prod-logger');

let logger = buildProdLogger();

module.exports = logger;