'use strict'

const query = `
  match (address:Address {id: {address}})
  with address, {currencies} as currencies
  match (address)-[index:Outputs]->(outputsIndex)-[pointer:Unspent]->(transaction)
  where index.id in currencies or index.default and length(currencies)=0
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
