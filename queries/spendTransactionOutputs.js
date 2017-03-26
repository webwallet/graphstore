'use strict'

const query = `
  create (spender:Transaction {id: {id}})
  with spender, range(0, size({outputs})) as outputsRange
  unwind outputsRange as i
  with spender, toString(i) as outputPosition, {outputs}[i] as output
  match (address:Address)-[:Outputs]->(outputsIndex)
    -[pointer:Unspent]->(spendee:Transaction)
  where address.id=output.address and
    (spendee.id + '::' + pointer.id) in output.previous
  create (spender)-[:Spends {id: pointer.id}]->(spendee)
  create (spender)<-[:Points {id: outputPosition}]-(outputsIndex)
  create (spender)<-[:Unspent {id: outputPosition}]-(outputsIndex)
  delete pointer
  with address.id as address, output.previous as previous
  return address, previous
`

module.exports = {
  string: query.replace(/\n/g, '').trim(),
  parser(result) {
    return {
      address: result.get('address'),
      previous: result.get('previous')
    }
  }
}
