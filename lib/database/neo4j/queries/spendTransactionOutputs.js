'use strict'

const uglifyQueryString = require('*lib/utils/uglifyQueryString')

const query = `
  unwind {countspaces} as countspace
  merge (issuer:Address {id: countspace})
  merge (space:Countspace {id: countspace})-[:Addresses]->(addresses:Index)
  merge (addresses)-[:Issuer]->(issuer)-[:Outputs {id: countspace}]->(:Index)
  with collect(space.id) as countspaces,
  range(0, size({outputs}) - 1) as outputsRange
  create (spender:Transaction {id: {id}})
  with spender, countspaces, outputsRange
  unwind outputsRange as i
  with spender, countspaces, toString(i) as outputPosition, {outputs}[i] as output
  match (countspace:Countspace {id: output.countspace})-[:Addresses]->(addressIndex)
  merge (address:Address {id: output.address})
  merge (address)<-[:Address]-(addressIndex)
  merge (address)-[:Outputs {id: output.countspace}]->(outputsIndex:Index)
  merge (outputsIndex)-[:Points {id: outputPosition}]->(spender)
  merge (outputsIndex)-[:Unspent {id: outputPosition}]->(spender)
  with address, countspace, outputsIndex, output, spender
  match (outputsIndex)-[unspent:Unspent]->(spendee:Transaction)
  where (spendee.id + '::' + unspent.id) in output.previous
  and not (spendee)<-[:Spends {id: unspent.id}]-()
  create (spender)-[spentOutput:Spends {id: unspent.id}]->(spendee)
  with address, countspace, collect(distinct unspent) as unspents,
  collect(spendee.id + '::' + spentOutput.id) as spendees, spender
  foreach(unspent in unspents | delete unspent)
  with collect({
    address: address.id,
    countspace: countspace.id,
    previous: spendees
  }) as outputs
  unwind (case {inputs} when [] then [''] else {inputs} end) as input
  merge (iou:IOU {id: input})-[:Funds]->(spender)
  return collect(iou.id) as inputs, outputs
`
const rest = `
  // and not (spender)<-[:Points {id: outputPosition}]-(outputsIndex)
`

module.exports = {
  string: uglifyQueryString(query),
  parser(result) {
    return {
      inputs: result.get('inputs'),
      outputs: result.get('outputs')
    }
  }
}
