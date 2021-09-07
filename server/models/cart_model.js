const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cart_schema = new Schema({
    cart_id : String,
    products : [[String, String]]
},{timestamps:true});

const Cart = mongoose.model('Cart', cart_schema);
module.exports = Cart;