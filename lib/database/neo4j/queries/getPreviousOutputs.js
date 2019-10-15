'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as countspaceId
  match (countspace:Countspace) where countspace.id = countspaceId
  match (countspace)-[:Addresses]->()-->(address:Address {id: $address})
  match (address)-[:Outputs]->()-[pointer:Points]->(transaction)
  with transaction, pointer skip $queryParams.skip limit $queryParams.limit
  return collect(transaction.id + '::' + pointer.id) as previousOutputs
`

module.exports = {
  txmode: 'read',
  string: uglifyQueryString(query),
  parser(result) {
    return {
      pointers: result.get('previousOutputs')
    }
  }
}
