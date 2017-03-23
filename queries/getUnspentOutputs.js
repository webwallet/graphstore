'use strict'

const query = `
  match (address:Address {id: {address}})
  with address
  match (address)-[outputs:Outputs]-(outputsIndex)-[pointer:Unspent]-(transaction)
  where outputs.id={currency} or outputs.default
  return collect(transaction.id + '::' + pointer.id) as transactions
`

module.exports = {
  string: query.replace(/\n/g, '').trim(),
  parser(result) {
    return {
      transactions: result.get('transactions')
    }
  }
}
