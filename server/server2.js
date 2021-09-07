//MONGOOSE
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const session = require('express-session');
const https = require('https');
const requestify = require('requestify');
var path = require('path');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static("src"));
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-carts?retryWrites=true&w=majority"
const Cart = require('./models/cart_model.js');
const Purchase = require('./models/purchase_model.js');
let cart_ids = getAllCartIDs();

app.set('trust proxy', 1) // trust first proxy

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    const corsWhitelist = [
        'https://enki-cart.herokuapp.com',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://enki-store.herokuapp.com'
    ];
    if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTION, HEAD');
    //res.header('Access-Control-Request-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials ');
    next();
});

mongoose.connect(MongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(port, () => console.log(`Listening on port ${port}...`)))
    .catch((err) => console.log(err));


//CART- Service
app.get('/cart', (req, res) => {

    //1. Validate if there is a cookie
    const { cookies } = req;
    let the_books = [];
    if ('cart_id' in cookies) {
        //find the cart
        Cart.findOne({ cart_id: cookies.cart_id }).then((the_cart) => {
            //console.log(the_cart.products);
            the_cart.products.forEach(product => {
                //TODO : CHANGE LINK
                requestify.get(`https://enki-cart.herokuapp.com/books/${product[0]}`).then(function (response) {
                    const element = response.getBody();
                    
                    const data = {
                        'quantity': product[1],
                        '_id': element._id,
                        'title': element.title,
                        'photo': element.photo,
                        'available': element.available,
                        'price': element.price,
                        'calculated_price': (product[1] * element.price).toFixed(2)
                    }
                    console.count(element.price);
                    //save the products in an array
                    the_books.push(data);
                    //if this is the last product from the list, then send the_books as result back
                    if (the_cart.products.length == the_books.length) {  
                            //the_books.sort((a, b) => a.title.localeCompare(b.title));
                            const result = { 'books': the_books };
                            res.send(result); 
                    }
                    });
            })
        }).catch((err) => {
            console.error(err);
        });
    }
});


app.post('/cart/purchase', (req, res) => {
    //TO TEST

    //validate cookies
    const { cookies } = req;

    if ('cart_id' in cookies) {

        //get the cart
        Cart.findOne({ cart_id: cookies.cart_id }).then((the_cart) => {
            //TODO : GET info about the logged user.
            
            const new_purchase = new Purchase({
                'user_id': cookies.user_id,
                'user_name': "TODO_name",
                'user_surname': 'TODO_surname',
                'products': the_cart.products
            })
            new_purchase.save().then((result)=>{
                console.log(result);
            }).catch((err)=>{
                console.error(err);
            });
            Cart.deleteOne({cart_id : cookies.cart_id});
        

            //make request to the Products service and update the "available" attribute of them
            const sold_products = {
                'sold': the_cart.products
            }
            requestify.put(`https://enki-cart.herokuapp.com/books`,sold_products).then(function (response) {
                console.log(response.status)

            })
            //makeHTTPrequest('PUT', 'enki-store.herokuapp.com', '/books', sold_products);

            //delete the cart_id cookie
            res.clearCookie('cart_id');
            res.send();
        });
    }
});


app.post('/cart', (req, res) => {
        //create one with the chosen product
        let randomNumber = generateRandomID();
        // //make sure carts don't get the same id
        // while (randomNumber in cart_ids) {
        //     randomNumber = generateRandomID();
        // }
        const new_cart = new Cart({
            'cart_id': randomNumber,
            'products': [
                [req.body.bookId, req.body.quantity]
            ]
        });
        //save the new cart
        new_cart.save().then((result)=>{
            console.log(result);
        }).catch((err)=>{
            console.error(err);
        })
        //send the cookie back
        res.setHeader('Set-Cookie', setCookie('cart_id', randomNumber, 5));
        res.status(200).send();
    
});


app.put('/cart', (req, res) => {
    //1. Validate if there is a cookie
    console.log("PUT")
    const { cookies } = req;
    //if there is already a created cart->update
    if ('cart_id' in cookies) {
        let the_new_data = [req.body.bookId, req.body.quantity];
        //find the product in the cart and update it
        Cart.findOne({cart_id:cookies.cart_id}).then((the_cart)=>{
            console.log(the_cart);
            const foundIndex = the_cart.products.findIndex(element => element[0] == the_new_data[0]);
            if (foundIndex > -1) {
                //check if i should delete this product from the cart
                if (the_new_data[1] == '0') {
                    the_cart.products.splice(foundIndex, 1);
                } else {
                    //update the products list
                    the_cart.products[foundIndex] = the_new_data;
                }
                Cart.findOneAndUpdate({cart_id : cookies.cart_id}, { products: the_cart.products },{ returnOriginal: false}).then((update)=>{
                    console.log(update);
                });
                // await mongoClient.db(the_db).collection(the_collection).findOneAndUpdate(filter, { $set: { products: the_cart.products } });
            }else{
                the_cart.products.push(the_new_data);
                Cart.findOneAndUpdate({cart_id : cookies.cart_id}, { products: the_cart.products },{ upsert: true, returnOriginal: false}).then((update)=>{
                    console.log(1);
                    console.log(update);
                });
            }
        });
        //db_connectAndDo(db_findAndUpdateCart, data_new, db_collection_carts, db_enki_carts, { cart_id: cookies.cart_id });
        res.status(200).send();
    }
});




//OTHER functions

function generateRandomID() {
    let randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    return randomNumber;
}

function getAllCartIDs() {
    Cart.find()
        .then((carts) => {
            const cart_ids = carts.map(cart => cart.cart_id);
            console.log(cart_ids);
            return cart_ids;
        }).catch((err) => {
            console.error(err)
        });
}

function setCookie(name, value, days) {
    return name + "=" + value + ";path=/;SameSite=None;Secure;Max-Age=" + 86400 * days;
}

// app.listen(port, () => console.log(`Listening on port ${port}...`));