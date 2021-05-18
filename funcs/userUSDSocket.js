const { WebSocketClient, WebSocketEvent, WebSocketChannelName } = require('coinbase-pro-node')
const auth = require('../auth.json')
const client = require('../utils/client')
const readline = require('readline')
readline.emitKeypressEvents(process.stdin)
if (process.stdin.isTTY)
  process.stdin.setRawMode(true)

base_currency = 'BTC'
quote_currency = 'USD'
product_id = base_currency + '-' + quote_currency
const channel = {
  name: WebSocketChannelName.TICKER,
  product_ids: [product_id],
}

let coinInfo = null

client.ws.on(WebSocketEvent.ON_OPEN, async () => {
  client.ws.on(WebSocketEvent.ON_MESSAGE, (data) => {
    if(data.type === 'ticker' && data.product_id === product_id) {
      /* console.log({
        product_id: data.product_id,
        best_bid: data.best_bid,
        best_ask: data.best_ask,
      }) */
      coinInfo = data
    }
  })

  client.ws.subscribe(channel)
})

client.ws.connect()

console.log('Buy? (1), Sell? (2), Cancel All Orders (3), Exit (4)')

process.stdin.on('keypress', async (str, key) => {
  if(coinInfo && ['1', '2', '3', '4'].includes(key.name)) {
    data = {
      product_id,
      best_ask: parseInt(coinInfo.best_ask),
      best_bid: parseInt(coinInfo.best_bid),
    }
    
    const accounts = await client.rest.account.listAccounts()
    const base_currency_info = accounts.find((account) => base_currency === account.currency)
    const quote_currency_info = accounts.find((account) => quote_currency === account.currency)
    
    if(!base_currency_info || !quote_currency_info)
      return
    
    const middlePrice = (data.best_ask + data.best_bid) / 2

    // Init coinbase pro
    if(parseFloat(quote_currency_info.available) > 0 && key.name === '1' && data.best_ask) {
      buy_order = {
        product_id,
        type: 'limit',
        side: 'buy',
        price: data.best_ask,
        size: (parseFloat(quote_currency_info.available) / middlePrice * 0.995).toFixed(8).toString(),
        time_in_force: 'GTC',
      }
      console.log(buy_order)
      client.rest.order.placeOrder(buy_order)
        // .then((response) => console.log(response))
        .catch((error) => console.log('An error has occurred with buy order'))
    } else if(parseFloat(base_currency_info.available) > 0 && key.name === '2' && data.best_bid) {
      sell_order = {
        product_id,
        type: 'limit',
        side: 'sell',
        price: data.best_bid,
        size: base_currency_info.available,
        time_in_force: 'GTC',
      }
      console.log(sell_order)
      client.rest.order.placeOrder(sell_order)
        // .then((response) => console.log(response))
        .catch((error) => console.log('An error has occurred with sell order'))
    } else if(key.name === '3')
      client.rest.order.cancelOpenOrders(product_id)
        // .then((response) => console.log(response))
        .catch((error) => console.log('An error has occurred with canceling all open orders'))
    else if(key.name === '4') {
      client.ws.unsubscribe(channel)
      console.error('Invalid choice. Program will now exit.')
      process.exit(1)
    }
    console.log('Buy? (1), Sell? (2), Cancel All Orders (3), Exit (4)')
  }
})
