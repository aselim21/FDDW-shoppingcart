const serverURL_products = 'http://127.0.0.1:3000';
const serverURL_cart = 'http://127.0.0.1:3000';
const serverURL_user = '';
//https://enki-cart.herokuapp.com --- http://127.0.0.1:3000

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    renderTemplate(`${serverURL_products}/products`,'./templates/products.mustache', 'target_products');
    operate_addToCartButton();
 
});

function renderTemplate(the_url, the_template, the_target) {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", the_url);
    xhttp.send();

    xhttp.onreadystatechange = (e) => {
        
        fetch(the_template).then((response) => response.text()).then((template) => {
            const obj = JSON.parse(xhttp.responseText);
            console.log(template);
            const rendered = Mustache.render(template, obj);
            document.getElementById(the_target).innerHTML = rendered;
        });
    }
}
 function operate_addToCartButton(){
    $(document).on("click","[data-js-cart]", async function(ev){
        const pressedButton = ev.currentTarget;
        const productId = pressedButton.getAttribute('data-js-product-id');
        const formQuantity = getFormDataAsObj(productId);

        const data = {
            bookId:productId,
            quantity: formQuantity.quantity
        }
        const jsondata = JSON.stringify(data);
      await PUTInfoTo(`${serverURL_cart}/cart`,jsondata)
    console.log(jsondata);


//get the response and do something
//set the cookie in the browser

      });
}
function getFormDataAsJSON(formID) {
    const data = $(`[${formID}]`).serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    const jsondata = JSON.stringify(data);
    return jsondata;
}
function getFormDataAsObj(formID) {
    const data = $(`[${formID}]`).serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    return data;
}
async function POSTInfoTo(serverURL_Endpoint, data) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", serverURL_Endpoint, true);
    xhttp.setRequestHeader("Accept", "application/json");
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
    xhttp.onreadystatechange = (e) => {
        if (xhttp.readyState === XMLHttpRequest.DONE) {
            console.log("xhttp");
            console.log(xhttp);
            return xhttp;
        }
           
    }
}

function getCookie(name) {
    let v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
  }
async function PUTInfoTo(serverURL_Endpoint, data) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("PUT", serverURL_Endpoint, true);
    xhttp.withCredentials = true;
    xhttp.setRequestHeader("Accept", "application/json");
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Access-Control-Allow-Credentials", "true");
    xhttp.send(data);
    xhttp.onreadystatechange = (e) => {
        console.log(e);
        if (xhttp.readyState === XMLHttpRequest.DONE) {
            console.log("xhttp");
            console.log(xhttp);
        }      
    }
}
