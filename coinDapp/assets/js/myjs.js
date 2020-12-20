
const signatures = []

async function fundContract() {
    var amount = $('#fundAmount').val()
    amount = web3.utils.toWei(amount, 'Ether')

    try {
        let event = await contractInstance.methods.funding().send({ value: amount })
        var myevent = event.events.contractFunded.returnValues
        let user = shortAddr(myevent.user)
        let fundAmount = myevent.fundAmount
        let fundedAmount = getEth(fundAmount)
        let msg = "<b>User:</b> " + user + " has funded contract with:<b> " + fundedAmount + " ETH</b>"
        dappBalance()
        userBalance()
        alert_msg(msg, 'success')
        $('#fundmodal').modal('hide')

    } catch (error) {
        if (error) {
            console.log(error)
            alert_msg(error, 'danger')
            return false;
        }
    }
}

//CONTRACT BALANCE
async function dappBalance() {

    var address = contractInstance._address
    var balance = await web3.eth.getBalance(address)
    var newbalance = await getEth(balance)
    $('#cBalance').html(numberFix(newbalance))
}


async function userBalance() {
    var accounts = await web3.eth.getAccounts()
    var address = accounts[0]
    var balance = await web3.eth.getBalance(address)
    var newbalance = await getEth(balance)
    $('#userBalance').html(numberFix(newbalance))
    $('#userAddr').html(shortAddr(address))
}

async function getUserAddress() {
    var accounts = await web3.eth.getAccounts()
    if (accounts.length) return accounts[0]
}

async function placeBet(face) {
    let newGameId;
    let betAmount = getWei($('#betAmount').val())
    let lastGame = document.getElementsByName('myalert')[0]
    if (empty(lastGame)) {

        newGameId = '1'

    } else {
        newGameNumber = parseInt(lastGame.id.replace(/\D/g, "")) + 1
        newGameId = newGameNumber

    }
    const userGame = {
        'id': newGameId,
        'is_new': true,
        'user': '',
        'amount': betAmount,
        'coinFace': face
    }

    $('#lastgames').prepend(lastGamesBox(userGame, false, true))


    try {
        let event = await contractInstance.methods.play(face).send({ value: betAmount })
        var gameId = await event.events.playGame.returnValues.id
        alert_msg('Bet placed for game Id: ' + gameId, 'info')
    } catch (error) {
        if (error) {
            console.log(error.message)
            $('#game' + newGameId).remove()
            alert_msg(error.message, 'danger')
            return false;
        }
    }

}

async function lastNum() {
    var lastN = await contractInstance.methods.latestnumber().call()
    console.log(lastN);
}


async function lastGames() {
    //Cleaning and Selecting last games box
    var lastGames = document.getElementById('lastgames')
    lastGames.innerHTML = "<div class='testBox' id='testBox'></div>";
    await contractInstance.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
    }, async function (error, events) {

        if (!error) {
            events.reverse()
            var i = 0;
            var pendingGames = ""
            for (var counter = 0; counter < events.length; counter++) {

                var eventName = events[counter].event

                if (eventName == "playGame" || eventName == "generatedRandomNumber") {

                    var queryId = events[counter].returnValues.queryId
                    var randNumber = parseInt(events[counter].returnValues.randomNumber)
                    var userGame = await contractInstance.methods.userGame(queryId).call()
                    var _coinFace = await userGame.coinFace
                    var userAddr = await userGame.user
                    var currentUser = await getUserAddress();

                    if (currentUser == userAddr) {

                        if (eventName == "playGame") {
                            
                            var approval = await contractInstance.methods.approved(queryId,currentUser).call()
                            console.log(events[counter], approval)     
                            if(approval == false){                                                        
                                console.log('Pending game...')                                
                                $('#lastgames').prepend(lastGamesBox(userGame, false, true))                                
                            }                           
   
                        }

                        if (eventName == "generatedRandomNumber") {
                            signatures.push(events[counter].signature)
                            userGame['randNumber'] = randNumber
                            userGame['coinFace'] = parseInt(_coinFace)
                            var win = gameLogic(parseInt(_coinFace), parseInt(randNumber))
                            $('#lastgames').append(lastGamesBox(userGame, win))
                            i++;                            
                            if (i > 4){                                                                
                                return;
                            } 
                        }
                    }
                }
            }
            
        } else {
            alert_msg(error, 'danger')
        }


    })

}

function gameLogic(coinFace, randNumber) {

    //Number Higher than 51
    if (coinFace == 1) {
        if (randNumber > 51) return true
    }
    //Number Lower than 49
    if (coinFace == 2) {
        if (randNumber < 49) return true;
    }
    return false;
}


function lastGamesBox(currentGame, win, pending = false) {

    var gameDiv = gameBoxContent(currentGame, win, pending)
    return gameDiv['box'];
}

function gameBox(content, gameId, type) {
    var box = `<div id="game` + gameId + `" class="alert alert-` + type + ` fit-content mt-3" name="myalert" role="alert">
                     `+ content + `
                    </div>`;
    return box;
}

function gameBoxContent(currentGame, win, pending) {

    var amount = Number(currentGame.amount)
    var winAmount = amount * 0.4;
    var betType = (currentGame.coinFace == 1) ? "Higher than 51" : "Lower than 49";

    if (pending == false) {
        var luckyNum = currentGame.randNumber
        var msg = `<div class='mb-2 mt-2'>
                     <i class='fas fa-star'></i> Lucky Number:<b>` + luckyNum + `</b>
                    </div>
                    <span class='gameId badge badge-dark'><b>GameId:  </b>` + currentGame.id + `</span>`

        if (win == true) {
            var totalwin = amount + winAmount
            var type = "success"
            msg += "Reward:<b class='mt-3 mb-3'>" + getEth(totalwin) + " Eth </b> "

        } else {

            var type = "warning"
            msg += "<b class='mt-3 mb-3'>Lose " + getEth(amount) + " Eth </b> "
        }
    } else {
        var gameNumber = currentGame.id;

        if (currentGame.is_new == true) {
            gameNumber = "<span class='c-yellow'>Awaiting...</span>"
        }
        var type = 'info'
        var msg = "<p class='m-0'>Awaiting for Oracle...</p><img src='assets/img/gift.gif' style='width:76px;'><span class='gameId badge badge-dark'><b>GameId:  </b>" + gameNumber + "</span>"
    }

    var boxComponents = []
    boxComponents['content'] = msg + "<div class='mt-2 mb-2'>Bet Type:<b> " + betType + "</b></div>"
    boxComponents['box'] = gameBox(boxComponents['content'], currentGame.id, type)
    return boxComponents

}

function oracleResponseBox(currentGame, win) {

    var gameId = currentGame.id
    var amount = Number(currentGame.amount)
    var winAmount = amount * 0.4;
    var betType = (currentGame.coinFace == 1) ? "Higher than 51" : "Lower than 49";

    var luckyNum = currentGame.randNumber
    var msg = `<div class='mb-2 mt-2'>
                  <i class='fas fa-star'></i>
                  Lucky Number:<b>` + luckyNum + `</b>
                </div>
                <span class='gameId badge badge-dark'><b>GameId:  </b>` + gameId + `</span>`

    if (win == true) {
        var totalwin = amount + winAmount
        msg += "Reward:<b class='mt-3 mb-3'>" + getEth(totalwin) + " Eth </b> "
    } else {
        msg += "<b class='mt-3 mb-3'>Lose " + getEth(amount) + " Eth </b> "
    }
    var box = msg + "<div class='mt-2 mb-2'>Bet Type:<b> " + betType + "</b></div>";
    return box;
}

$('#fundAmount').keyup(function () {
    let betAmount = $('#fundAmount').val()
    $('#fundingAmount').html(betAmount + " ETH")
});

$('#betAmount').keyup(function () {

    let betAmount = $('#betAmount').val()
    var earning = betAmount * 40 / 100;
    earning = earning + Number(betAmount)
    $('#reward').html(earning)
});

function openFundModal() {

    $('#fundmodal').modal('show')

}

function numberFix(number) {
    return new Intl.NumberFormat('de-DE').format(number)
}
