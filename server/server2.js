//MONGOOSE
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const session = require('express-session');
var path = require('path');
const app = express();
app.use(express.static("src"));
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-carts?retryWrites=true&w=majority"
const Cart = require('./models/cart_model.js');


mongoose.connect(MongodbURI, {useNewUrlParser: true, useUnifiedTopology : true})
.then((result) => app.listen(port, () => console.log(`Listening on port ${port}...`)))
.catch((err) => console.log(err));

//CART- Service
 app.get('/cart', (req, res) => {

Cart.find().then((result)=>{
    res.send(result);
}).catch((err)=>{
    console.error(err);
})


      //if there is no cart, create one with the chosen product
    //   let randomNumber = generateRandomID();
    //   //make sure carts don't get the same id
    // //   while (randomNumber in cart_ids) {
    // //       randomNumber = generateRandomID();
    // //   } 

    //   const new_cart = new Cart({
    //       'cart_id': randomNumber,
    //       'products': [
    //           ["Test", "Test2"]
    //       ]
    //   });

    //   new_cart.save()
    //   .then((result)=>{
    //       res.send(result);
    //   }).catch((err) =>{
    //       console.error(err);
    //   })

//     //1. Validate if there is a cookie
//     const { cookies } = req;
//     let the_books = [];

//     if ('cart_id' in cookies) {
//         //find the cart
//         db_connectAndDo(db_findCartId, false, db_collection_carts, db_enki_carts, req.cookies.cart_id)
//             .then((the_cart) => {
//                 //retrieve more data for each product
//                 the_cart.products.forEach(product => {
//                     db_connectAndDo(db_findElementById, false, db_collection_products, db_enki_products, product[0]).then((element) => {
//                         data = {
//                             'quantity': product[1],
//                             '_id': element._id,
//                             'title': element.title,
//                             'photo': element.photo,
//                             'available': element.available,
//                             'price': element.price,
//                             'calculated_price': (product[1] * element.price).toFixed(2)
//                         }
//                         //save the products in an array
//                         the_books.push(data);
//                         //if this is the last product from the list, then send the_books as result back
//                         if (the_cart.products.indexOf(product) == the_cart.products.length - 1) {

//                             setTimeout(function () {
//                                 the_books.sort((a, b) => a.title.localeCompare(b.title));
//                                 const result = { 'books': the_books };
//                                 res.send(result);
//                                 //wait 1ms in order the processes to finish without data being lost
//                             }, 100);
//                         }
//                     });
//                 });
//             });
//     }
 });


app.put('/cart', (req, res) => {
    //1. Validate if there is a cookie
    const { cookies } = req;

    //if there is already a created cart->update
    if ('cart_id' in cookies) {
        let data_new = [req.body.bookId, req.body.quantity];
        //find the product in the cart and update it
        //db_connectAndDo(db_findAndUpdateCart, data_new, db_collection_carts, db_enki_carts, { cart_id: cookies.cart_id });
    } else {
        //if there is no cart, create one with the chosen product
        let randomNumber = generateRandomID();
        //make sure carts don't get the same id
        while (randomNumber in cart_ids) {
            randomNumber = generateRandomID();
        } 

        const new_cart = new Cart({
            'cart_id': randomNumber,
            'products': [
                [req.body.bookId, req.body.quantity]
            ]
        });

        new_cart.save()
        .then((result)=>{
            res.send(result);
        }).catch((err) =>{
            console.error(err);
        })

        // new_cart = {
        //     'cart_id': randomNumber,
        //     'products': [
        //         [req.body.bookId, req.body.quantity]
        //     ]
        // }
        // //save the new cart
        // db_connectAndDo(db_insertData, new_cart, db_collection_carts, db_enki_carts);

        //send the cookie back
        res.setHeader('Set-Cookie', setCookie('cart_id', randomNumber, 5));
        res.status(200).send();
    }
});


//OTHER functions
function generateRandomID() {
    let randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    return randomNumber;
}

const port = process.env.PORT || 3000;
// app.listen(port, () => console.log(`Listening on port ${port}...`));