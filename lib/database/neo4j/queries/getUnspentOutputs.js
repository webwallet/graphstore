'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  match (address:Address {id: {address}})
  with address, {countspaces} as countspaces
  match (address)-[index:Outputs]->(outputsIndex)-[pointer:Unspent]->(transaction)
  where index.id in countspaces or index.default and size(countspaces)=0
  return collect(transaction.id + '::' + pointer.id) as unspentOutputs
`

module.exports = {
  txmode: 'read',
  string: uglifyQueryString(query),
  parser(result) {
    return {
      pointers: result.get('unspentOutputs')
    }
  }
}
