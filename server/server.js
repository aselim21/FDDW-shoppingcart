//MONGOOSE
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const requestify = require('requestify');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwtSecret = 'enki-online-book-store'; // secret for jwt authentication
const PORT = process.env.PORT || 3000;
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-carts?retryWrites=true&w=majority"
const Cart = require('./models/cart_model.js');
const Purchase = require('./models/purchase_model.js');

const serverURL_products = 'https://enki-product.herokuapp.com'

const app = express();

// var corsOptions = {
//     origin: 'https://enki-bookstore.herokuapp.com',
//     optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204,
//     credentials: true
// }
const corsWhitelist = [
    'https://enki-bookstore.herokuapp.com',
    'https://enki-product.herokuapp.com'
];
var corsOptions = {
    origin: function (origin, callback) {
        if (corsWhitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204,
    credentials: true
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    // const corsWhitelist = [
    //     'http://127.0.0.1:5500',
    //     'http://127.0.0.1:5501',
    //     'http://127.0.0.1:3000',
    //     'http://127.0.0.1:3001',
    //     'https://enki-bookstore.herokuapp.com',
    //     'https://enki-product.herokuapp.com'
    // ];
    // if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
    //     res.header('Access-Control-Allow-Origin', req.headers.origin);
    // }
    // res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTION, HEAD');
    //res.header('Access-Control-Request-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials ');
    next();
});

mongoose.connect(MongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(PORT, () => console.log(`Listening on port ${PORT}...`)))
    .catch((err) => console.log(err));

app.get('/', (req, res) => {
    res.send("Welcome to Enki's Shopping Cart Service")
})

app.get('/cart', (req, res) => {
    //1. Validate if there is a cookie
    const { cookies } = req;
    let the_books = [];

    if ('cart_id' in cookies) {
        //find the cart
        Cart.findOne({ cart_id: cookies.cart_id }).then((the_cart) => {
            //read the product-id's from the cart
            the_cart.products.forEach(product => {
                //get details about the product communicating with the products service
                requestify.get(`${serverURL_products}/books/${product[0]}`).then(function (response) {
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
                    //save the products in an array
                    the_books.push(data);
                    //if this is the last product from the list, then send the_books as a result back
                    if (the_cart.products.length == the_books.length) {
                        the_books.sort((a, b) => a.title.localeCompare(b.title));
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
    //console.log(req.user);

    if ('cart_id' in cookies) {

        //get the cart
        Cart.findOne({ cart_id: cookies.cart_id }).then((the_cart) => {
            //TODO : GET info about the logged user.

            const new_purchase = new Purchase({
                'user_id': "Users ID",
                'user_name': "TODO",
                'user_last_name': "TODO",
                'street': "TODO",
                'city': "TODO",
                'country_code': 123,
                'sum_total': req.body.price,
                'products': the_cart.products
            });
            new_purchase.save().then((result) => {
                //console.log(result);
            }).catch((err) => {
                console.error(err);
            });
            Cart.deleteOne({ cart_id: cookies.cart_id })
                .then((result) => {
                    console.log(result)
                }).catch((err) => {
                    console.error(err)
                });
            //make request to the Products service and update the "available" attribute of them
            const sold_products = {
                'sold': the_cart.products
            }
            requestify.put(`${serverURL_products}/books`, sold_products)
                .then(function (response) {
                    console.log(response);
                });

            //delete the cart_id cookie
            res.clearCookie('cart_id');
            res.send();
        }).catch((err) => {
            console.error(err);
        });
    }
});


app.post('/cart', (req, res) => {
    //create one with the chosen product
    let randomNumber = generateRandomID();
    const new_cart = new Cart({
        'cart_id': randomNumber,
        'products': [
            [req.body.bookId, req.body.quantity]
        ]
    });
    //save the new cart
    new_cart.save().then((result) => {
    }).catch((err) => {
        console.error(err);
    })
    //send the cookie back
    res.setHeader('Set-Cookie', setCookie('cart_id', randomNumber, 5));
    res.status(200).send();

});


app.put('/cart', (req, res) => {
    //1. Validate if there is a cookie
    const { cookies } = req;
    //if there is already a created cart->update
    if ('cart_id' in cookies) {
        let the_new_data = [req.body.bookId, req.body.quantity];
        //find the product in the cart and update it
        Cart.findOne({ cart_id: cookies.cart_id }).then((the_cart) => {
            //search if this product is in the cart already
            const foundIndex = the_cart.products.findIndex(element => element[0] == the_new_data[0]);
            if (foundIndex > -1) {
                //check if this product should be deleted from the cart
                if (the_new_data[1] == '0') {
                    //delete the product from the list
                    the_cart.products.splice(foundIndex, 1);
                } else {
                    //update the product
                    the_cart.products[foundIndex] = the_new_data;
                }
            } else {
                //if this product is not already in the cart, add it to it
                the_cart.products.push(the_new_data);
            }
            //update the products property in the cart
            Cart.findOneAndUpdate({ cart_id: cookies.cart_id }, { products: the_cart.products }, { returnOriginal: false })
                .then((update) => {
                    console.log(update);
                    res.status(200).send();
                }).catch((err) => {
                    console.log(err)
                });
        });
    }
});


//OTHER functions

function generateRandomID() {
    const randomNumber = Math.random().toString();
    const the_id = randomNumber.substring(2, randomNumber.length);
    return the_id;

}

function setCookie(name, value, days) {
    return name + "=" + value + ";path=/;SameSite=None;Secure;Max-Age=" + 86400 * days;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) res.sendStatus(401);
    else {
        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                console.log(err);
                res.sendStatus(403);
            } else {
                req.user = user;
                next();
            }
        })
    }
}
