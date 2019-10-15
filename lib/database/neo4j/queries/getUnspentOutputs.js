'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as countspaceId
  match (countspace:Countspace {id: countspaceId})
  match (countspace)-[:Addresses]->(address:Address)
  where address.id = $address
  match (address)-[pointer:Outputs]->(transaction:Transaction)
  where not (transaction)<-[:Sources {id: pointer.id}]-(:Transaction)
  return collect(transaction.id + '::' + pointer.id) as unspentOutputs
`

module.exports = {
  txmode: 'read',
  string: uglifyQueryString(query),
  parser: (result) => {
    return {
      pointers: result.get('unspentOutputs')
    }
  }
}
