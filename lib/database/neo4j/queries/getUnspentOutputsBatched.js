'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as spaceParams
  match (countspace:Countspace {id: spaceParams.symbol})
  with * unwind spaceParams.addresses as addressId
  match (countspace)-[:Addresses]->(address:Address {id: addressId})
  with *, [(address)-[pointer:Outputs]->(transaction:Transaction)
    where not (transaction)<-[:Sources {id: pointer.id}]-(:Transaction)
    | transaction.id + '::' + pointer.id] as unspentOutputs
  return countspace.id as symbol, collect({
    address: address.id,
    outputs: unspentOutputs
  }) as addresses
`

module.exports = {
  txmode: 'read',
  string: uglifyQueryString(query),
  parser: (result) => {
    return {
      symbol: result.get('symbol'),
      addresses: result.get('addresses')
    }
  }
}
