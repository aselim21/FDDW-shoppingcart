//MONGOOSE
const mongoose = require('mongoose');
const express = require('express');
const requestify = require('requestify');
const jwt = require('jsonwebtoken');
const refreshTokenSecret = 'enki-refresh-token';
const PORT = process.env.PORT || 3000;
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-carts?retryWrites=true&w=majority"
const Cart = require('./models/cart_model.js');
const Purchase = require('./models/purchase_model.js');

const serverURL_products = 'https://enki-product.herokuapp.com'

const app = express();
app.use(express.json());
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
        console.log(req.headers.origin);
    }
    // res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, HEAD');
    //res.header('Access-Control-Request-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials ');
    next();
});

mongoose.connect(MongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(PORT, () => console.log(`Listening on port ${PORT}...`)))
    .catch(err => res.status(400).json("Error: " + err));

app.get('/', (req, res) => {
    res.send("Welcome to Enki's Shopping Cart Service")
})
app.get('/carts/:id',(req,res)=>{
    const cart_id_value = req.params.id;
    let the_books = [];
    if (cart_id_value != null) {
        //find the cart
        Cart.findOne({ cart_id: cart_id_value }).then((the_cart) => {
            //read the product-id's from the cart
            if( the_cart.products.length == 0){
                res.send("Cart is empty");
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
                    }
                });
            })
        }).catch(err => res.status(400).json("Error: " + err));

    } else {
        res.send("no cart_id was found");
    }
});


app.post('/cart/purchase', (req, res) => {
   //1. Validate if there is a cookie
   const cart_id_value = req.body.cart_id;
   const refreshToken_value = req.body.jid;
   console.log(cart_id_value);
   console.log(refreshToken_value)

    if (cart_id_value && refreshToken_value ) {

        //get the cart
        Cart.findOne({ cart_id: cart_id_value }).then((the_cart) => {
            
            if(the_cart == null){
            res.send("Cart doesn't exist");
            }else{
              //TODO : GET info about the logged user.  
            const user = authenticateToken(refreshToken_value);
            const new_purchase = new Purchase({
                'user_name': user.name,
                'user_last_name': user.last_name,
                'street': user.street,
                'city': user.city,
                'country_code': user.country_code,
                'sum_total': req.body.price,
                'products': the_cart.products
            });
            new_purchase.save().then((result) => {
                console.log(result);
            }).catch(err => res.status(400).json("Error: " + err));
            Cart.deleteOne({ cart_id: cart_id_value })
                .then((result) => {
                    console.log(result)
                }).catch(err => res.status(400).json("Error: " + err));
            //make request to the Products service and update the "available" attribute of them
            const sold_products = {
                'sold': the_cart.products
            }
            requestify.put(`${serverURL_products}/books`, sold_products)
                .then(function (response) {
                    console.log(response);
                }).catch(err => res.status(400).json("Error: " + err));
            res.send();
            }
        }).catch(err => res.status(400).json("Error: " + err));
    } else {
        res.send("No cart_id or jid");
    }
});

app.get('/carts',(req,res)=>{
    Cart.find()
    .then((result)=>{
        res.send(result);
    }).catch(err => res.status(400).json("Error: " + err))
});
app.get('/purchases',(req,res)=>{
    Purchase.find()
    .then((result)=>{
        res.send(result);
    }).catch(err => res.status(400).json("Error: " + err))
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
        console.log(result);
    }).catch(err => res.status(400).json("Error: " + err))
    //send the cookie back
    res.status(200).send(randomNumber);
});


app.put('/cart', (req, res) => { 
    //1. Validate if there is a cookie
    const cart_id_value = req.body.cart_id;

    //if there is already a created cart->update
    if (cart_id_value != null) {
        let the_new_data = [req.body.bookId, req.body.quantity];
        //find the product in the cart and update it
        Cart.findOne({ cart_id: cart_id_value }).then((the_cart) => {

            //search if this product is in the cart already
            console.log(the_cart)
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
            Cart.findOneAndUpdate({ cart_id: cart_id_value}, { products: the_cart.products }, { returnOriginal: false })
                .then((update) => {
                    console.log(update);
                    res.status(200).send("cookie was updated");
                }).catch(err => res.status(400).json("Error: " + err));
        });
    }else{
        res.status(200).send("Tried to PUT but cookie_id is null");
    }
});


//OTHER functions

function generateRandomID() {
    const randomNumber = Math.random().toString();
    const the_id = randomNumber.substring(2, randomNumber.length);
    return the_id;

}

function setCookie(name, value, days) {
    return name + "=" + value + ";Secure;SameSite=None;Path=/;Max-Age=" + 86400 * days;
}

function authenticateToken(token) {
    
    const user = jwt.verify(token, refreshTokenSecret, (err, the_user) => {
        if (err) {
          console.log(err);
         return 0;
        } else { 
          return the_user;
         
        }
      });
      console.log(user);
      return user;
    
  }