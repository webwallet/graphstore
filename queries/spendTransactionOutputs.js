'use strict'

const query = `
  create (spender:Transaction {id: {id}})
  with spender
  unwind {inputs} as input
  merge (iou:IOU {id: input})-[:Funds]->(spender)
  with spender, range(0, size({outputs})) as outputsRange, collect(iou) as ious
  unwind outputsRange as i
  with spender, toString(i) as outputPosition, {outputs}[i] as output
  match (address:Address)-[index:Outputs]->(outputsIndex)
  where address.id=output.address and index.id=output.currency
  merge (spender)<-[:Points {id: outputPosition}]-(outputsIndex)
  merge (spender)<-[:Unspent {id: outputPosition}]-(outputsIndex)
  with address, spender, outputsIndex, output
  match (outputsIndex)-[pointer:Unspent]->(spendee:Transaction)
  where (spendee.id + '::' + pointer.id) in output.previous
  create (spender)-[:Spends {id: pointer.id}]->(spendee)
  delete pointer
  return address.id as address, output.previous as previous
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
