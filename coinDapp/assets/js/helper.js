



/* HELPER FUNTIONS  */

function shortAddr(address){
    var firstPart = address.substr(0, 6);
    var secondPart = address.substr(38, 4);
    var userAddr = firstPart + "...." + secondPart

    return userAddr;
}

function go_to(url) {
    window.location.href = url;
}


function alert_msg(content, type) {
    var str = '';
    str += '<div id="myalert" class="alert alert-' + type + ' fit-content border border-dark mt-3" role="alert">' + content + '<button type="button" class="close ml-2" data-dismiss="alert" aria-label="Close"> <i class="far fa-times-circle"></i> </button></div>';
    $('#message').html(str)
    disable_alert()
}

function log(data) {
    return console.log(data)
}

function disable_alert() {
    setTimeout(function () {
        $('#myalert').fadeOut();
    }, 8000);
}

//ether to wei
function getWei(amount) {
    amount = amount.toString()
    return web3.utils.toWei(amount, "Ether")
}

//Wei to ether
function getEth(amount) {
    amount = amount.toString()
    return web3.utils.fromWei(amount, "Ether")
}


$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

function empty(str) {
    return (!str || 0 === str.length);
}

