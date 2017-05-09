'use strict'

const query = `
  match (address:Address {id: {address}})
  with address, {countspace} as countspace
  match (address)-[index:Outputs]->(outputsIndex)-[pointer:Unspent]->(transaction)
  where index.id in countspace or index.default and size(countspace)=0
  return collect(transaction.id + '::' + pointer.id) as unspentOutputs
`

module.exports = {
  string: query.replace(/\n/g, '').trim(),
  parser(result) {
    return {
      pointers: result.get('unspentOutputs')
    }
  }
}
