'use strict'

const uglifyQueryString = require('*lib/utils/uglifyQueryString')

const query = `
  unwind {countspaces} as countspace
  merge (issuer:Address {id: countspace})
  merge (space:Countspace {id: countspace})-[:Addresses]->(addresses:Index)
  merge (addresses)-[:Issuer]->(issuer)-[:Outputs {id: countspace}]->(:Index)
  with collect(space.id) as countspaces, range(0, size({outputs}) - 1) as outputsRange
  create (spender:Transaction {id: {id}})
  with spender, countspaces, outputsRange
  unwind outputsRange as i
  with spender, countspaces, toString(i) as outputPosition, {outputs}[i] as output
  match (countspace:Countspace {id: output.countspace})-[:Addresses]->(addressIndex)
  merge (address:Address {id: output.address})
  merge (address)<-[:Address]-(addressIndex)
  merge (address)-[:Outputs {id: output.countspace}]->(addressOutputs:Index)
  merge (addressOutputs)-[:Points {id: outputPosition}]->(spender)
  merge (addressOutputs)-[:Unspent {id: outputPosition}]->(spender)
  with address, addressOutputs, output, spender
  match (addressOutputs)-[pointer:Unspent]->(spendee:Transaction)
  where (spendee.id + '::' + pointer.id) in output.previous
  and not (spendee)<-[:Spends {id: pointer.id}]-()
  create (spender)-[:Spends {id: pointer.id}]->(spendee)
  with collect(distinct pointer) as pointers,
    collect(spendee.id + '::' + pointer.id) as addresses
  foreach(pointer in pointers | delete pointer)
  return addresses
`
const rest = `
  // and not (spender)<-[:Points {id: outputPosition}]-(outputsIndex)

  // with address, output, collect(output) as outs, ious
  // return ious as inputs,
  // collect({
  //   address: address.id,
  //   countspace: output.countspace,
  //   previous: output.previous
  // }) as outputs
`

module.exports = {
  string: uglifyQueryString(query),
  parser(result) {
    return {
      addresses: result.get('addresses'),
      // countspaces: result.get('countspaces'),
      // inputs: result.get('inputs'),
      // outputs: result.get('outputs')
    }
  }
}
