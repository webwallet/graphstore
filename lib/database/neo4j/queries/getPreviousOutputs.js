'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as countspaceId
  match (countspace:Countspace {id: countspaceId})
  match (countspace)-[:Addresses]->(address:Address)
  where address.id = $address
  match (address)-[pointer:Outputs]->(transaction:Transaction)
  with transaction, pointer skip $queryParams.skip limit $queryParams.limit
  return collect(transaction.id + '::' + pointer.id) as previousOutputs
`

module.exports = {
  txmode: 'read',
  string: uglifyQueryString(query),
  parser: (result) => {
    return {
      pointers: result.get('previousOutputs')
    }
  }
}
