const { MongoClient, ConnectionClosedEvent } = require('mongodb');
const express = require('express');
const cookieParser = require('cookie-parser');

var path = require('path');
const app = express();
// app.use(express.static("src"));
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const mongoClient = new MongoClient(MongodbURI);
const db_enki_carts = 'enki-carts';
const db_enki_users = 'enki-users';
const db_enki_products = 'enki-products';
const db_collection_carts = 'carts';
const db_collection_purchase = 'purchase';
const db_collection_products = 'products';
const db_collecrion_users = 'users';
const ObjectId = require('mongodb').ObjectId;

const https = require('https');


const serverURL_products = 'http://127.0.0.1:3000'
const serverURL_cart = 'http://127.0.0.1:3000';
//http://127.0.0.1:3000 https://enki-cart.herokuapp.com
const serverURL_user = '';

let cart_ids = db_connectAndDo(db_getAllCartIDs);

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

//zu löschen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src', '/index.html'));
});
app.get('/home-index', (req, res) => {
    res.sendFile(path.join(__dirname, '../src', 'index.html'));
});
app.get('/products-index', (req, res) => {
    res.sendFile(path.join(__dirname, '../src', 'products.html'));
});
app.get('/cart-index', (req, res) => {
    res.sendFile(path.join(__dirname, '../src', 'cart.html'));
});

//CART- Service
app.get('/cart', (req, res) => {

    //1. Validate if there is a cookie
    const { cookies } = req;
    let the_books = [];

    if ('cart_id' in cookies) {
        //find the cart
        db_connectAndDo(db_findCartId, false, db_collection_carts, db_enki_carts, req.cookies.cart_id)
            .then((the_cart) => {
                //retrieve more data for each product
                the_cart.products.forEach(product => {
                    db_connectAndDo(db_findElementById, false, db_collection_products, db_enki_products, product[0]).then((element) => {
                        data = {
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
                        //if this is the last product from the list, then send the_books as result back
                        if (the_cart.products.indexOf(product) == the_cart.products.length - 1) {

                            setTimeout(function () {
                                the_books.sort((a, b) => a.title.localeCompare(b.title));
                                const result = { 'books': the_books };
                                res.send(result);
                                //wait 1ms in order the processes to finish without data being lost
                            }, 100);
                        }
                    });
                });
            });
    }
});

app.post('/cart/purchase', (req, res) => {
    //validate cookies
    const { cookies } = req;

    if ('cart_id' in cookies) {
        //get the cart
        db_connectAndDo(db_findCartId, false, db_collection_carts, db_enki_carts, cookies.cart_id).then((the_cart) => {

            //TODO : GET info about the logged user.
            const purchase = {
                'user_id': cookies.user_id,
                'user_name': "TODO_name",
                'user_surname': 'TODO_surname',
                'products': the_cart.products
            }
            //create a purchase and delete the cart
            db_connectAndDo(db_insertData, purchase, db_collection_purchase, db_enki_carts);
            db_connectAndDo(db_deleteElementByFilter, false, db_collection_carts, db_enki_carts, { cart_id: cookies.cart_id });

            //make request to the Products service and update the "available" attribute of them
            const sold_products = {
                'sold': the_cart.products
            }
            makeHTTPrequest('PUT', 'enki-store.herokuapp.com', '/books', sold_products);

            //delete the cart_id cookie
            res.clearCookie('cart_id');
            res.send();
        })
    }
});

app.put('/cart', (req, res) => {
    //1. Validate if there is a cookie
    const { cookies } = req;

    //if there is already a created cart->update
    if ('cart_id' in cookies) {
        let data_new = [req.body.bookId, req.body.quantity];
        //find the product in the cart and update it
        db_connectAndDo(db_findAndUpdateCart, data_new, db_collection_carts, db_enki_carts, { cart_id: cookies.cart_id });
    } else {

        //if there is no cart, create one with the chosen product
        let randomNumber = generateRandomID();
        //make sure carts don't get the same id
        while (randomNumber in cart_ids) {
            randomNumber = generateRandomID();
        }
        new_cart = {
            'cart_id': randomNumber,
            'products': [
                [req.body.bookId, req.body.quantity]
            ]
        }
        //save the new cart
        db_connectAndDo(db_insertData, new_cart, db_collection_carts, db_enki_carts);

        //send the cookie back
        res.setHeader('Set-Cookie', setCookie('cart_id', randomNumber, 5));
        res.status(200).send();
    }
});


//PRODUCTS - Service

app.get('/books', (req, res) => {
    //send all books from the db
    db_connectAndDo(db_findAll, false, db_collection_products, db_enki_products, false)
        .then((results) => {
            let data = { "book_results": results }
            res.send(data);
        });
});

app.get('/books/:id', (req, res) => {
    //send only a specific book
    const book_id = req.params.id;
    console.log(book_id);
    db_connectAndDo(db_findElementById, false, db_collection_products, db_enki_products, book_id)
        .then((result) => {
            res.send(result);
        });
});

app.put('/books', (req, res) => {
    //update the "available" of the products that are bought
    const products = req.body.sold;
    products.forEach((product) => {
        //update every product
        db_connectAndDo(db_findAndUpdateProduct, product[1], db_collection_products, db_enki_products, { _id: ObjectId(product[0]) });
    });
});

app.get('/books/:genre', (req,res)=>{
    const the_genre = req.params.genre;
    const the_filter = { 'genre': the_genre };
    //console.log(the_filter);
    db_connectAndDo(db_findByFilter, false, db_collection_products, db_enki_products, {genre : the_genre}).then((result)=>{
        res.send(result);

    });
});


//DATABASE - functions
async function db_connectAndDo(todo, data, the_collection, the_db, filter) {
    try {
        await mongoClient.close();
        await mongoClient.connect();
        if (todo == db_findByFilter) {
            return await todo(the_collection, the_db, filter);
        } else if (todo == db_findElementById) {
            return await todo(the_collection, the_db, filter)
        } else if (todo == db_findCartId) {
            return await todo(the_collection, the_db, filter)
        } else if (todo == db_findAll) {
            return await todo(the_collection, the_db);
        } else if (todo == db_getAllCartIDs) {
            return await todo();
        } else if (todo == db_insertData) {
            return await todo(data, the_collection, the_db);
        } else if (todo == db_findAndUpdateCart) {
            return await todo(data, the_collection, the_db, filter);
        } else if (todo == db_deleteElementByFilter) {
            return await todo(the_collection, the_db, filter);
        } else if (todo == db_findAndUpdateProduct) {
            return await todo(data, the_collection, the_db, filter)
        } else {
            console.log("Function not found");
            return -1;
        }
    } catch (e) {
        console.error(e);
    }
}



async function db_findAndUpdateProduct(sold_number, the_collection, the_db, the_filter) {
    try {
        //find the product
        const the_product = await mongoClient.db(the_db).collection(the_collection).findOne(the_filter);
        //calculate the new "available" value
        const new_value = parseInt(the_product.available) - parseInt(sold_number);
        //update the product
        await mongoClient.db(the_db).collection(the_collection).updateOne(the_filter, { "$set": { "available": new_value.toString() } }, { "upsert": false });
    } catch (e) {
        console.error(e);
    }
}

async function db_insertData(data, the_collection, the_db) {
    try {
        const result = await mongoClient.db(the_db).collection(the_collection).insertOne(data);
        console.log(`Inserted new row in DB ${the_db} -> ${the_collection} with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}

async function db_findCartId(the_collection, the_db, the_id) {
    const result = await mongoClient.db(the_db).collection(the_collection).findOne({ cart_id: the_id });
    console.log("Cart_id found");
    if (result) {
        console.log(`Found a listing in the collection with the id '${the_id}':`);
        return result;
    } else {
        console.log(`No listings found with the id '${the_id}'`);
        return 0;
    }
}

async function db_deleteElementByFilter(the_collection, the_db, filter) {
    await mongoClient.db(the_db).collection(the_collection).deleteOne(filter)
        .then(result => { console.log(`Deleted ${result.deletedCount} item.`); return result.deletedCount })
        .catch(err => { console.error(`Delete failed with error: ${err}`); return result.deletedCount });
}

async function db_findAndUpdateCart(the_new_data, the_collection, the_db, filter) {
    try {
        //find the cart
        const the_cart = await mongoClient.db(the_db).collection(the_collection).findOne(filter);
        //check if the product is already in cart
        const foundIndex = the_cart.products.findIndex(element => element[0] == the_new_data[0]);
        //if a product is found
        if (foundIndex > -1) {
            //check if i should delete this product from the cart
            if (the_new_data[1] == '0') {
                the_cart.products.splice(foundIndex, 1);
                console.log(the_cart.products);
            } else {
                //update the products list
                the_cart.products[foundIndex] = the_new_data;
            }
            await mongoClient.db(the_db).collection(the_collection).findOneAndUpdate(filter, { $set: { products: the_cart.products } });
        } else {
            //if this product isn't in the cart, then insert a new product in the cart
            await mongoClient.db(the_db).collection(the_collection).findOneAndUpdate(filter, { $push: { products: the_new_data } });
        }
    } catch (e) {
        console.error(e);
    }
}
async function db_findByFilter(the_collection, the_db, the_filter) {
    const cursor = await mongoClient.db(the_db).collection(the_collection).find({genre : the_filter});
    const results = await cursor.toArray();
    results.sort((a, b) => a.title.localeCompare(b.title));
    if (results.length > 0) {
        console.log(`Found a listing in the collection with the '${the_filter}':`);
        return results;
    } else {
        console.log(`No listings found with the '${the_filter}'`);
        return 0;
    }
}
async function db_findElementById(the_collection, the_db, the_id) {
    const result = await mongoClient.db(the_db).collection(the_collection).findOne({ _id: ObjectId(the_id) });
    if (result) {
        console.log(`Found a listing in the collection with the id '${the_id}':`);
        return result;
    } else {
        console.log(`No listings found with the id '${the_id}'`);
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

async function db_getAllCartIDs() {
    const cursor = await mongoClient.db(db_enki_carts).collection(db_collection_carts).find();
    const results = await cursor.toArray();
    const resultsIDs = results.map(x => x.cart_id);
    if (resultsIDs.length > 0) {
        console.log(`Found a listing in the collection :`);
        return resultsIDs;
    } else {
        console.log(`No listings found `);
        return 0;
    }
}

//COMMENTED - functions

// async function updateListingByName(client, nameOfListing, updatedListing) {
//     const result = await client.db("sample_airbnb").collection("listingsAndReviews")
//         .updateOne({ name: nameOfListing }, { $set: updatedListing });
//     console.log(`${result.matchedCount} document(s) matched the query criteria.`);
//     console.log(`${result.modifiedCount} document(s) was/were updated.`);
// }

// async function db_updateData(the_new_data, the_collection, the_db, filter) {

//     try {
//         const result = await mongoClient.db(the_db).collection(the_collection).updateOne(filter, { $addFields: { products: { $concatArrays: ["$products", ["test", "0"]] } } });
//         console.log(`${result.matchedCount} document(s) matched the query criteria.`);
//         console.log(`${result.modifiedCount} document(s) was/were updated.`);
//     } catch (e) {
//         console.error(e);
//     }
// }

// async function db_aggregateData(the_new_data, the_collection, the_db, filter) {

//     try {
//         const result = await mongoClient.db(the_db).collection(the_collection).aggregate([{ $match: { cart_id: filter } }, { $addFields: { products: { $concatArrays: ["$products", [["test", "0"]]] } } }]);
//         aggregate([
//             { $match: { _id: 1 } },
//             { $addFields: { homework: { $concatArrays: ["$homework", [7]] } } }
//         ])
//         console.log(`${result.matchedCount} document(s) matched the query criteria.`);
//         console.log(`${result.modifiedCount} document(s) was/were updated.`);
//     } catch (e) {
//         console.error(e);
//     }
// }

//OTHER- functions

function makeHTTPrequest(the_method, the_host, the_path, data) {

    const options = {
        hostname: the_host,
        path: the_path,
        method: the_method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
        }
    }
    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);
    })

    req.on('error', error => {
        console.error(error);
    });

    req.write(JSON.stringify(data));
    req.end();
}

function setCookie(name, value, days) {
    return name + "=" + value + ";path=/;SameSite=None;Secure;Max-Age=" + 86400 * days;
}

function generateRandomID() {
    let randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    return randomNumber;
}


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
