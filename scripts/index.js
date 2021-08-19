const serverURL_products = 'http://localhost:3000';
const serverURL_cart = 'http://localhost:3000';
const serverURL_user = '';

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
            const obj = JSON.parse(xhttp.responseText);
            console.log(template);
            const rendered = Mustache.render(template, obj);
            document.getElementById(the_target).innerHTML = rendered;
        });
    }
}

function operate_addToCartButton(){
    $(document).on("click","[data-js-cart]",function(ev){
        const pressedButton = ev.currentTarget;
        const productId = pressedButton.getAttribute('data-js-product-id');
        const formQuantity = getFormDataAsObj(productId);

        const data = {
            bookId:productId,
            quantity: formQuantity.quantity
        }
        const jsondata = JSON.stringify(data);
        //+ the number
       POSTInfoTo(`${serverURL_cart}/cart`,jsondata)
    console.log(jsondata);
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
function POSTInfoTo(serverURL_Endpoint, data) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", serverURL_Endpoint, true);
    xhttp.setRequestHeader("Accept", "application/json");
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
}