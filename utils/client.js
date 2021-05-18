const auth = require('../auth.json')
const { CoinbasePro } = require('coinbase-pro-node')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

/* 
const initClient = () => {
  readline.question('Sandbox (0) or Personal (1) account? ', (choice) => {
    // Init coinbase pro
    if(choice === '0')
      client = new CoinbasePro(auth.sandbox)
    else if(choice === '1')
      client = new CoinbasePro(auth.personal)
    else {
      console.error('Invalid choice. Program will now exit.')
      process.exit(1)
    }
  })
}

initClient()
 */

const client = new CoinbasePro(auth.sandbox)

module.exports = client