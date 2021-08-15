const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
app.use(express.json());
const MongodbURI = "mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const mongoClient = new MongoClient(MongodbURI);
const db_enki_carts = 'enki-carts';
const db_enki_users = 'enki-users';
const db_enki_products = 'enki-products';
const db_collection_carts = 'carts';
const db_collection_products = 'products';
const db_collecrion_users = 'users';

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.get('/', (req, res) => {

});

app.get('/cart', (req, res) => {

    console.log(req.body);
});

app.post('/cart', (req, res) => {

});

app.put('/cart', (req, res) => {

});

async function db_connectAndDo(todo, data, the_collection, the_db) {
    try {
        await mongoClient.close();
        await mongoClient.connect();
        await todo(data, the_collection, the_db);
    } catch (e) {
        console.error(e);
    }finally{
       
    }
}

async function db_insertData(data, the_collection, the_db) {
    console.log("instering...")

    try {
        const result = await mongoClient.db(the_db).collection(the_collection).insertOne(data);
        console.log(`Inserted new row in DB ${the_db} -> ${the_collection} with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}
async function db_updatetData(data, the_collection, the_db) {

    try {
        const result = await mongoClient.db(the_db).collection(the_collection).insertOne(data);
        console.log(`Inserted new row in DB ${db_db} -> ${the_collection} with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}
const data_users = {
    "name": "Max",
    "last_name": "Mustermann",
    "email": "test@gmail.com",
    "password": "mustermann1234",
    "street": "Lindenstrasse 51",
    "city": "Wien",
    "country_code": "1547",
    "country": "Oesterreich"
};
const data_users_2 = {
    "name": "Eva",
    "last_name": "Musterfrau",
    "email": "test@gmail.com",
    "password": "musterfrau1234",
    "street": "Barbarossaplatz 1",
    "city": "Koeln",
    "country_code": "1547",
    "country": "Deutschland"
};
const data_products = {
    "title": "Harry Potter and the Philosopher's Stone",
    "author": "J. K. Rowling",
    "ganre": "novel",
    "published": "26/06/1997",
    "pages": "320",
    "price": "10.78",
    "currency": "euro",
    "photo": "url?",
    "description": "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his grisly aunt and uncle. Then, on Harry's eleventh birthday, a great beetle-eyed giant of a man called Rubeus Hagrid bursts in with some astonishing news: Harry Potter is a wizard, and he has a place at Hogwarts School of Witchcraft and Wizardry. An incredible adventure is about to begin! These editions of the classic and internationally bestselling, multi-award-winning series feature instantly pick-up-able jackets by award-winning illustrator Jonny Duddle, and are the perfect starting point for anyone who's ready to lose themselves in the biggest children's books of all time."
};
const data_products_two = {
    "title": "Harry Potter and the Chamber of Secrets",
    "author": "J. K. Rowling",
    "ganre": "novel",
    "published": "01/09/2014",
    "pages": "259",
    "price": "10.50",
    "currency": "euro",
    "photo": "url?",
    "description": "Let the magic of J.K. Rowling's classic series take you back to Hogwarts School of Witchcraft and Wizardry. Issued to mark the 20th anniversary of first publication of Harry Potter and the Chamber of Secrets, these irresistible House Editions celebrate the noble character of the four Hogwarts houses. Featuring gorgeous house-themed cover art and interior line illustrations by Kate Greenaway Medal winner Levi Pinfold, each book will also have vibrant sprayed edges in the house livery. Entertaining bonus features exclusive to each house accompany the novel. All seven books in the series will be issued in these highly collectable House Editions. A must-have for anyone who has ever imagined sitting under the Sorting Hat in the Great Hall at Hogwarts waiting to hear the words, 'Better be GRYFFINDOR!'"
};

db_connectAndDo(db_insertData, data_users, db_collecrion_users, db_enki_users ).catch(console.error);
db_connectAndDo(db_insertData, data_users_2,db_collecrion_users, db_enki_users ).catch(console.error);
db_connectAndDo(db_insertData, data_products, db_collection_products, db_enki_products).catch(console.error);
db_connectAndDo(db_insertData, data_products_two, db_collection_products, db_enki_products).catch(console.error);



const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));