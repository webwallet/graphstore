'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as countspaceId
  match (countspace:Countspace) where countspace.id = countspaceId
  match (countspace)-[:Addresses]->()-->(address:Address {id: $address})
  match (address)-[:Outputs {id: countspace.id}]->()-[pointer:Unspent]->(transaction)
  return collect(distinct transaction.id + '::' + pointer.id) as unspentOutputs
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
