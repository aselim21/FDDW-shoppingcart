const mongoose = require('mongoose');
const express = require('express');
const requestify = require('requestify');
const PORT = process.env.PORT || 3000;
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-carts?retryWrites=true&w=majority"
const Cart = require('./models/cart_model.js');
const Purchase = require('./models/purchase_model.js');
const Log = require('./models/log_model.js');
const logger = require('./logger');
const serverURL_products = 'https://enki-product.herokuapp.com'
const serverURL_users = 'https://enki-user-service.herokuapp.com'

const app = express();
app.use(express.json());

//set headers
app.use((req, res, next) => {
    const corsWhitelist = [
        'http://127.0.0.1:5500',
        'http://127.0.0.1:5501',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://enki-bookstore.herokuapp.com',
        'https://enki-product.herokuapp.com',
        'https://enki-store.herokuapp.com'
    ];
    if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        logger.info(`HTTP Request received from origin ${req.headers.origin}`);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials, Cookie, Set-Cookie, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, HEAD');
    next();
});

//connect with DB and start the server
mongoose.connect(MongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(PORT, () => {
        logger.info(`Listening on port ${PORT}...`);
    }))
    .catch(err => {
        logger.error(err);
        res.status(400).json("Error: " + err)
    });

//-----------------------------CART-----------------------

app.get('/', (req, res) => {
    res.send("Welcome to Enki's Shopping Cart Service")
});

//get all carts
app.get('/carts', (req, res) => {
    Cart.find()
        .then((result) => {
            logger.info('GET /carts', result)
            res.send(result);
        }).catch(err => {
            res.status(400).json("Error: " + err);
            logger.error(err);
        })
});

//get a specific cart with additional information about the products : 
//get the cart -> send GET request to Products Service for each product from the list -> gather the information and send it back 
app.get('/carts/:id', (req, res) => {
    logger.info('GET /carts/:id', req.params.id);
    const cart_id_value = req.params.id;
    let the_books = [];
    if (cart_id_value != null) {
        //find the cart
        Cart.findOne({ cart_id: cart_id_value }).then((the_cart) => {
            //read the product-id's from the cart
            if (the_cart.products.length == 0) {
                res.send("Cart is empty");
                logger.info("The Cart is Empty", the_cart, the_cart, products);
            }
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
                        logger.info("Cart found, data sent", the_cart, result);
                    }
                });
            })
        }).catch(err => {
            res.status(400).json("Error: " + err);
            logger.error(`Error finding the Cart with ID ${req.params.id}.`, err);
        });

    } else {

        res.send("no cart_id was found");
        logger.warn("Cart_id has value NULL", req.params.id);
    }
});

//create a new cart with the sent product and quantity
app.post('/cart', (req, res) => {

    logger.info('POST cart', req.body);
    //create a random cartID
    let randomNumber = generateRandomID();

    const new_cart = new Cart({
        'cart_id': randomNumber,
        'products': [
            [req.body.bookId, req.body.quantity]
        ]
    });
    //save the new cart
    new_cart.save().then((result) => {
        logger.info("New Cart was saved.", result);
        console.log(result);
    }).catch(err => {
        res.status(400).json("Error: " + err);
        logger.error("Error saving the New Cart", err);

    })
    //send the cart ID back
    res.status(200).send(randomNumber);
    logger.info('New Cart ID was sent as response', randomNumber);
});

//update an existing cart : add a product+quantity, update the quantity of the product or delete a product+quantity 
app.put('/cart', (req, res) => {
    logger.info('PUT /cart', req.body)

    //if there is already a created cart->update
    if (req.body.cart_id && req.body.bookId && req.body.quantity) {
        const cart_id_value = req.body.cart_id;
        let the_new_data = [req.body.bookId, req.body.quantity];
        //find the product in the cart and update it
        Cart.findOne({ cart_id: cart_id_value }).then((the_cart) => {

            const foundIndex = the_cart.products.findIndex(element => element[0] == the_new_data[0]);
            //search if this product is in the cart already
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
            Cart.findOneAndUpdate({ cart_id: cart_id_value }, { products: the_cart.products }, { returnOriginal: false })
                .then((update) => {
                    res.status(200).send("Cookie has been updated");
                    logger.info("Cookie has been updated.", update);
                }).catch(err => {
                    res.status(400).json("Error: " + err);
                    logger.error('Error updating the Cart.', err);
                });
        }).catch(err => {
            res.status(400).json("Error: " + err);
            logger.error('Error finding the Cart', err);
        });;
    } else {
        res.status(200).send("Tried to update Cart, but the Cart_ID, Book_ID, or Quantity was NULL.");
        logger.warn("Tried to update Cart, but the Cart_ID, Book_ID, or Quantity was NULL.", req.body.cart_id)
    }
});

//-----------------------------PURCHASE-----------------------
//get all purchases
app.get('/purchases', (req, res) => {
    Purchase.find()
        .then((result) => {
            res.send(result);
            logger.info('GET /purchases', result);
        }).catch(err => {
            res.status(400).json("Error: " + err);
            logger.error('Error finding purchases', err);
        })
});

//create a purchase: 
//send post request to User service to validate the user and get User details -> create a purchase -> delete the cart of the purchase -> send PUT requests to Products service 
//to update the "available" parameter of each product.
app.post('/cart/purchase', checkLogin, (req, res) => {

    logger.info('POST /cart/purhcase', req.body);
    const cart_id_value = req.body.cart_id;
    // const login_token = req.body.login_token;
    //1. Validate if there is a cookie
    if (cart_id_value) {

        //get the cart
        Cart.findOne({ cart_id: cart_id_value }).then((the_cart) => {

            if (the_cart == null) {
                res.send("Cart doesn't exist");
                logger.warn("Tried to create a Purchase, but the Cart_id was NULL", req.body.cart_id)
            } else {

                const new_purchase = new Purchase({
                    'user_name': req.user.name,
                    'user_last_name': req.user.last_name,
                    'street': req.user.street,
                    'city': req.user.city,
                    'country_code': req.user.country_code,
                    'sum_total': req.body.price,
                    'products': the_cart.products
                });
                new_purchase.save().then((result) => {
                    logger.info("New Purchase has been created", result);
                }).catch(err => {
                    res.status(400).json("Error: " + err);
                    logger.error("Error saving the new Purchase", err);
                });
                Cart.deleteOne({ cart_id: cart_id_value })
                    .then((result) => {
                        logger.info("The Cart has been deleted", cart_id_value);
                    }).catch(err => {
                        res.status(400).json("Error: " + err);
                        logger.error("Error tring to delete the Cart", err);
                    });
                //make request to the Products service and update the "available" attribute of them
                const sold_products = {
                    'sold': the_cart.products
                }
                requestify.put(`${serverURL_products}/books`, sold_products)
                    .then(function (response) {
                        logger.info("Books Service PUT", response, sold_products);
                    }).catch(err => {
                        res.status(400).json("Error: " + err);
                        logger.error("Error updating the books from Books Service", err);
                    });
                res.send();
            }
        }).catch(err => {
            res.status(400).json("Error: " + err);
            logger.error("Error finding the cart", err)
        });
    } else {
        res.send("No cart_id or jid");
        logger.warn("No Cart_ID or JID was found", req.body);
    }
});





//OTHER functions

function generateRandomID() {
    const randomNumber = Math.random().toString();
    const the_id = randomNumber.substring(2, randomNumber.length);
    return the_id;

}

function checkLogin(req, res, next) {
    //const data = { login_token: req.body.login_token };

    requestify.request(`${serverURL_users}/checkLogin`, {
        method: 'POST',
        headers: {
            'Authorization': req.body.login_token
        }		
    }).then((response) => {
        if (response.body.checkLogin == true) {
            req.the_user = response.body.user;
            logger.info('Books Service PUT /checkLogin successfull', response.body.user);
            next();
        }else {
            logger.warn("Unauthorized user trying to purchase", response);
            res.status(401).send();
        }
    }).catch((err) => {
        logger.error(err);
    });
}


//----------------------LOGS-------------------
//get all logs of the service
app.get('/logs', (req, res) => {
    Log.find()
        .then((result) => {
            res.send(result);
        }).catch(err => {
            res.status(400).json("Error: " + err);
            logger.error(err);
        })
})