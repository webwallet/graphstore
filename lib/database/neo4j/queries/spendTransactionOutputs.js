'use strict'

const query = `
  create (spender:Transaction {id: {id}})
  with spender
  unwind {inputs} as input
  merge (iou:IOU {id: input})-[:Funds]->(spender)
  with spender, range(0, size({outputs})) as outputsRange, collect(iou.id) as ious
  unwind outputsRange as i
  with spender, toString(i) as outputPosition, {outputs}[i] as output, ious
  match (address:Address)-[index:Outputs]->(outputsIndex)
  where address.id=output.address and index.id=output.currency
  merge (spender)<-[:Points {id: outputPosition}]-(outputsIndex)
  merge (spender)<-[:Unspent {id: outputPosition}]-(outputsIndex)
  with address, spender, outputsIndex, output, ious
  match (outputsIndex)-[pointer:Unspent]->(spendee:Transaction)
  where (spendee.id + '::' + pointer.id) in output.previous
  and not (spendee)<-[:Spends {id: pointer.id}]-()
  create (spender)-[:Spends {id: pointer.id}]->(spendee)
  delete pointer
  with address, output, collect(output) as outs, ious
  return ious as inputs,
  collect({
    address: address.id,
    currency: output.currency,
    previous: output.previous
  }) as outputs
`

module.exports = {
  string: query.replace(/\n/g, '').trim(),
  parser(result) {
    return {
      inputs: result.get('inputs'),
      outputs: result.get('outputs')
    }
  }
}
