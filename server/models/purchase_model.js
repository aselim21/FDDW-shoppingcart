const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const purchase_schema = new Schema({
    user_id: String,
    user_name: String,
    user_email: String,
    products: [[String,String]]
},{timestamps:true});

const Purchase = mongoose.model('Purchse', purchase_schema);
module.exports = Purchase;