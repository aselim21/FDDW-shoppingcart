const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const log_schema = new Schema({
},{timestamps:true});

const Log = mongoose.model('Log', log_schema);
module.exports = Log;