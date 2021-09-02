const { MongoClient } = require('mongodb');
const express = require('express');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const session =require('express-session');
const app = express();
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const mongoClient = new MongoClient(MongodbURI);
const db_enki_carts = 'enki-carts';
const db_enki_users = 'enki-users';
const db_enki_products = 'enki-products';
const db_collection_carts = 'carts';
const db_collection_products = 'products';
const db_collecrion_users = 'users';

//TODO! Load all cart ids here in the beginning!
let cart_ids = [];

//Cookies
app.set('trust proxy', 1) // trust first proxy
 
// app.use(cookieSession({
//   name: 'session',
//   keys: ['key1', 'key2']
// }))

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DEL, OPTION, HEAD');
    //res.header('Access-Control-Request-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials ');
    
    next();
});
// app.use((err, req, res, next) => {
//     res.locals.error = err;
//     const status = err.status || 500;
//     res.status(status);
//     res.render('error');
//   });

function validateCookie(req,res,next){
    const {cookies} = req ;
    console.log(cookies);
    next();
}
app.get('/', validateCookie, (req, res) => {
    //res.cookie('session_id', '123456');
    //res.status(200).json({msg : 'Loggedin'});
});

app.get('/cart', (req, res) => {
    res.status(200).json({msg : 'welcome to cart'});
    const {cookies} = req ;
    console.log(cookies);

  
});



app.post('/cart', (req, res, next) => {
    // //generate random cookie?
    console.log(req.body);
   
});

function setCookie(name, value, days) {
    return name + "=" + value + ";path=/;SameSite=None;Secure;Max-Age=" + 86400*days  ;
}

app.put('/cart',validateCookie, (req, res) => {
    //1. Validate if there is a cookie
    const {cookies} = req ;
    console.log(req.cookies);

    if('cart_id' in cookies){
        //find it from the db and actualize it
        console.log('Cookie found');
        console.log(cookies.cart_id);
        //db function to update an existing cart
    }else{
        let randomNumber = Math.random().toString();
        randomNumber = randomNumber.substring(2,randomNumber.length);
        while(randomNumber in cart_ids){
            //make sure carts don't get the same id
            randomNumber = Math.random().toString();
            randomNumber = randomNumber.substring(2,randomNumber.length);
        }
        data = {
            'cart_id': randomNumber,
            'products': [
                [req.body.bookId, req.body.quantity]
            ]
        }
        console.log(data);
        //TODO save tha data in DB
 
        res.setHeader('Set-Cookie',setCookie('cart_id',randomNumber,5));
        res.status(200).send();
        cart_ids.push(randomNumber);
        console.log(cart_ids);
    }
    //if there is, update this one
    //if not create a new one with the product


});

//SERVER - Products
app.get('/products', (req, res) => {
    db_connectAndDo(db_findAll, false, db_collection_products, db_enki_products, false)
        .then((results) => {
            let data = {"book_results": results}
            res.send(data);
            console.log(data);
        });
});
app.get('/products/:genre', (req, res) => {
    console.log(req.params.genre);
    db_connectAndDo(db_findGenre, req.params.genre, db_collection_products, db_enki_products, false)
        .then((results) => {
            //let data = {"book_results": results}
            res.json({book_results : results})
            //res.send(data);
            console.log(data);
        });

});

async function db_connectAndDo(todo, data, the_collection, the_db, filter) {
    try {
        await mongoClient.close();
        await mongoClient.connect();
        if(todo == db_findGenre){
            return await todo(data, the_collection, the_db, filter);
        }else
        if(todo == db_updateData) {
            return await todo(data, the_collection, the_db)
        }else
        if(todo == db_findAll){
            return await todo(the_collection, the_db)
        }else {
            console.log("Function not found");
            return -1;
        }
    } catch (e) {
        console.error(e);
    }
}

async function db_insertData(data, the_collection, the_db) {
    console.log("inserting...")

    try {
        const result = await mongoClient.db(the_db).collection(the_collection).insertOne(data);
        console.log(`Inserted new row in DB ${the_db} -> ${the_collection} with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}
async function updateListingByName(client, nameOfListing, updatedListing) {
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
        .updateOne({ name: nameOfListing }, { $set: updatedListing });
    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
}
async function db_updateData(the_new_data, the_collection, the_db, filter) {

    try {
        const result = await mongoClient.db(the_db).collection(the_collection).updateOne(filter, { $set: the_new_data });
        console.log(`${result.matchedCount} document(s) matched the query criteria.`);
        console.log(`${result.modifiedCount} document(s) was/were updated.`);
    } catch (e) {
        console.error(e);
    }
}
async function db_findGenre(the_genre, the_collection, the_db) {
    const cursor = await mongoClient.db(the_db).collection(the_collection).find({ genre: the_genre });
    const results = await cursor.toArray();
    results.sort((a, b) => a.title.localeCompare(b.title));
    if (results.length > 0) {
        console.log(`Found a listing in the collection with the genre '${the_genre}':`);
        return results;
    } else {
        console.log(`No listings found with the genre '${the_genre}'`);
        return 0;
    }
}
async function db_findAll(the_collection, the_db) {
    const cursor = await mongoClient.db(the_db).collection(the_collection).find();
    const results = await cursor.toArray();
    results.sort((a, b) => a.title.localeCompare(b.title));
    if (results.length > 0) {
        console.log(`Found a listing in the collection :`);
        return results;
    } else {
        console.log(`No listings found `);
        return 0;
    }
}
async function db_findCart(the_collection, the_db){
    const cursor = await mongoClient.db(the_db).collection(the_collection).findOne('');
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
