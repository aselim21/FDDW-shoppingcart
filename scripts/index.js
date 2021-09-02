const serverURL_products = 'fddw-shoppingcart-aselim21.vercel.app';
const serverURL_cart = 'fddw-shoppingcart-aselim21.vercel.app';
const serverURL_user = '';
//https://enki.vercel.app ----- http://127.0.0.1:3000

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    renderTemplate(`${serverURL_products}/products`,'./styles/templates/products.mustache', 'target_products')
        operate_addToCartButton();
 
});

function renderTemplate(the_url, the_template, the_target) {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", the_url);
    xhttp.send();

    xhttp.onreadystatechange = (e) => {
        
        fetch(the_template).then((response) => response.text()).then((template) => {
            console.log(xhttp.responseText);
            const obj = JSON.parse(xhttp.responseText);
            console.log(obj);
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
        //+ the number
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
    console.log(document.cookie);
    // xhttp.setRequestHeader('Set-Cookie', `cart_id=${getCookie('cart_id')}`);
    // xhttp.setRequestHeader('Set-Cookie', `cart_id=${getCookie('cart_id')}`);
    // [`cart_id=${getCookie('cart_id')}`]
    xhttp.send(data);

    console.log(getCookie('cart_id'));//null
    //return xhttp;
    xhttp.onreadystatechange = (e) => {
        console.log(e);
        if (xhttp.readyState === XMLHttpRequest.DONE) {
            console.log("xhttp");
            console.log(xhttp);
            //document.cookie = 'cart_id' + "=" + xhttp.responseText + ";SameSite=None;Secure";
            setCookie('cart_id', xhttp.responseText, 1);
        }      
    }
}
//   // create ajax request with jquery
//   $.ajax({
//     contentType: 'application/json',
//     data: JSON.stringify({
//       salutation: salutation,
//       firstName: firstName,
//       street: street,
//       houseNumber: houseNumber,
//       postalCode: postalCode,
//       city: city,
//       email: email,
//       telephone: telephone,
//       amount: amount,
//       event_id: event_id
//     }),
//     dataType: 'json',
//     xhrFields: {
//       withCredentials: true
//     },
//     success: function (data) {
//       console.log('success');
//     },
//     error: function (data) {
//       console.log('error');
//     },
//     processData: false,
//     type: 'POST',
//     url: url + 'booking'
//   });


// helper function from https://plainjs.com/javascript/utilities/set-cookie-get-cookie-and-delete-cookie-5/   d.toDateString()

function setCookie(name, value, days) {
    let d = new Date;
    d.setTime(d.getTime() + 24*60*60*1000*days);
    document.cookie = name + "=" + value + ";path=/;SameSite=None;Secure;expires=" +  "Thu, 02-Sep-2021 13:00:00 GMT" ;
    console.log(d.toDateString());
}