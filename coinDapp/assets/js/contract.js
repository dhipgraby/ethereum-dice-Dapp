var web3 = new Web3(Web3.givenProvider);
var contractInstance;
var lastEvent = ""
$(document).ready(function () {
  window.ethereum.enable().then(async function (accounts) {
    //Rinkeby address 0x3Eed064436E36bc6b5159cDD2CcB62E64853Dc47
    //KOVAN 0x7480690A7e1a50bf119c3797F030418244552CCa
    contractInstance = new web3.eth.Contract(abi, "0x7480690A7e1a50bf119c3797F030418244552CCa", { from: accounts[0] });
    //Loading Balance
    dappBalance()
    userBalance()
    //Loading last games
    lastGames()

    //EVENT HANDLER

    await contractInstance.events.generatedRandomNumber()
      .once('data', (oracle) => globEvents(oracle))
      .on('error', console.error);

    await contractInstance.events.playGame()
      .once('data', (event) => globEvents(event))
      .on('error', console.error);

  });

  async function playEvent(event) {


    console.log('playGame event trigger');
    //if(event.returnValues.user != getUserAddress()) return;
    const userGame = {
      'id': event.returnValues.id,
      'user': shortAddr(event.returnValues.user),
      'amount': event.returnValues.amount,
      'coinFace': parseInt(event.returnValues.coinFace)
    }
    var currentGame = $('#game' + userGame.id);
    if (empty(currentGame)) {
      $('#lastgames').prepend(lastGamesBox(userGame, false, true))
    } else {
      var content = gameBoxContent(userGame, false, true)
      currentGame.html(content['content'])
    }
    var games = document.getElementsByName('myalert')

    //If there is a minimum of 5 last games
    if (!empty(games[5])) {
      games[5].style = "opacity:0";
      setTimeout(() => {
        games[5].parentNode.removeChild(games[5])
      }, 1500)
    }
    dappBalance()
    userBalance()

    await contractInstance.events.playGame()
      .once('data', (event) => globEvents(event))
      .on('error', console.error);
  }


  async function oracleResponse(event) {
    console.log('Oracle response event trigger');
    var queryId = event.returnValues.queryId
    var randNumber = parseInt(event.returnValues.randomNumber)
    var userGame = await contractInstance.methods.userGame(queryId).call()
    var _coinFace = await userGame.coinFace
    updateGame(userGame, randNumber, _coinFace)
    dappBalance()
    userBalance()
    await contractInstance.events.generatedRandomNumber()
      .once('data', (oracle) => globEvents(oracle))
      .on('error', console.error);
  }

  function updateGame(userGame, randNumber, _coinFace) {

    userGame['randNumber'] = randNumber
    userGame['coinFace'] = parseInt(_coinFace)
    var win = gameLogic(parseInt(_coinFace), parseInt(randNumber))
    console.log(userGame)
    setTimeout(() => {
      var resultClass = (win == true) ? "alert-success" : "alert-warning";
      console.log('#game' + userGame.id)
      $('#game' + userGame.id).removeClass("alert-info")
      $('#game' + userGame.id).addClass(resultClass)
      $('#game' + userGame.id).html(oracleResponseBox(userGame, win))
    }, 1500)
  }

  //SETTING EVENTS  
  function globEvents(event) {
    if (event.event == "playGame") playEvent(event)
    if (event.event == "generatedRandomNumber") oracleResponse(event)
  }

});




