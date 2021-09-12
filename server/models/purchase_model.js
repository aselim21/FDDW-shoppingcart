const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const purchase_schema = new Schema({
    user_id: String,
    user_name: String,
    user_last_name: String,
    street: String,
    city: String,
    country_code: Number,
    sum_total: String,
    products: [[String,String]]
},{timestamps:true});

const Purchase = mongoose.model('Purchase', purchase_schema);
module.exports = Purchase;