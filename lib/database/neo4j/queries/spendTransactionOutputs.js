'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind {countspaces} as countspace
  merge (space:Countspace {id: countspace})-[:Addresses]->(addresses:Index)
  with collect(space.id) as countspaces,
  range(0, size({outputs}) - 1) as outputsRange
  create (spender:Transaction {id: {id}, time: timestamp()})
  with spender, countspaces, outputsRange
  unwind outputsRange as i
  with spender, countspaces, toString(i) as outputPosition, {outputs}[i] as output
  match (countspace:Countspace {id: output.counter})-[:Addresses]->(addressIndex)
  merge (address:Address {id: output.address})<-[:Address]-(addressIndex)
  merge (address)-[:Outputs {id: output.counter}]->(outputsIndex:Index)
  merge (outputsIndex)-[:Points {id: outputPosition}]->(spender)
  merge (outputsIndex)-[:Unspent {id: outputPosition}]->(spender)
  with address, countspace, outputsIndex, output.sources as previous, spender
  unwind (case previous when [] then [''] else previous end) as previousOutput
  optional match (outputsIndex)-[unspent:Unspent]->(spendee:Transaction)
  where (spendee.id + '::' + unspent.id) = previousOutput
  and not (spendee)<-[:Spends {id: unspent.id}]-()
  foreach (spendee in case exists(spendee.id) when true then [spendee] else [] end |
    merge (spender)-[spentOutput:Spends {id: unspent.id}]->(spendee))
  with address, countspace, spender, collect(distinct unspent) as unspents,
  filter(previousOutput in collect(distinct spendee.id + '::' + unspent.id)
    where size(previousOutput) > 0) as previousOutputs
  foreach(unspent in unspents | delete unspent)
  with spender, collect({
    address: address.id,
    counter: countspace.id,
    sources: previousOutputs
  }) as outputs
  unwind (case {inputs} when [] then [''] else {inputs} end) as input
  merge (iou:IOU {id: input})<-[:Clears]-(spender)
  return spender.id as id, collect(iou.id) as inputs, outputs
`
const rest = `
  collect(spendee.id + '::' + spentOutput.id) as spendees, spender

  // and not (spender)<-[:Points {id: outputPosition}]-(outputsIndex)
`

module.exports = {
  string: uglifyQueryString(query),
  parser(result) {
    return {
      id: result.get('id'),
      inputs: result.get('inputs'),
      outputs: result.get('outputs')
    }
  }
}
