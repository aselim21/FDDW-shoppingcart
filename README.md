# Enki-Shopping Cart Service

Repository für FDDW im SS 2021 von Achelia Selim für das Projekt "Enki": E-Commerce Website for Books. https://github.com/cywind1/FDDWSS21_ChanMeisenhelterSelim
Gruppenmitglieder: Achelia Selim, Ching Ying Chan und Alwin Meisenhelter.

## Documentation
Web Service, written in Node.js for creating shopping carts, updating the products inside of a shopping cart and creating a purchase.

Main Ressources: Cart, Purchase

### Build
The actual version is 1.0.0 and is dependent from the following APIs - "express": "^4.17.1", "jsonwebtoken": "^8.5.1", "mongoose": "^6.0.5", "requestify": "^0.2.5".

### Deployed in Heroku

#### URL: https://enki-cart.herokuapp.com
#### The Logs of the service: https://enki-cart.herokuapp.com/logs

The service is connected to MongoDB.

## How to

### 1. CART

* GET '/carts' - sends back all the carts from the database.
* GET '/cart/:id' - sends back not only the specific shopping cart, but also makes a request to the sister Service of Enki - products, in order to get the needed information for a functioning cart. Because Carts Service doesn't save any other data about the products except for their id. Retrieving information about the specific products could be done either from Cart service or on the Client side. Because this functionality is one of the primary operations of Products, the requests are done from the Cart Service.
* POST '/cart' - creates a new shopping cart in the database with the product_id and its quantity as its first product in the list.
* PUT '/cart' - this function updates  the products list of an existing shopping cart. Depending on the payload a new product can be added, the quantity of an existing product can be updated or a product can be deleted from the cart.

### 2. Purchase

* GET '/purhcases' - sends back all the purhcases from the database.
* POST 'cart/purchase' - After validating that the user has logged in and has an existing shopping cart, a new Purchase with user's details and products list is being created, the shipping cart is being deleted from the DB and a PUT request to the Products Service is being fired. This last step has the goal to decrement the "available" attribute of the products, that have been purchased.  

#### The project-website that implements this service : https://enki-bookstore.herokuapp.com


