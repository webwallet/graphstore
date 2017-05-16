'use strict'

const uglifyQueryString = require('*lib/utils/uglifyQueryString')

/** Initializes a Countspace by creating the required nodes and relationships
 * (or returns the existing ones if applicable)
 * nodes: Countspace (x1), Address (x1), Index (x1)
 **/
const query = `
  unwind {spaces} as countspace
  merge (node:Countspace {id: countspace.id})
  merge (issuer:Address {id: countspace.id})
  merge (node)-[:Issuer]->(issuer)
  merge (issuer)-[:Outputs {id: countspace.id}]->(outputs:Index)
  foreach (id in countspace.addresses |
    merge (address:Address {id: id})
    merge (address)-[:Outputs {id: countspace.id}]->(:Index)
    merge (node)-[:Address]->(address)
  )
  return collect({
    id: countspace.id,
    node: node is not null,
    issuer: issuer is not null,
    outputs: outputs is not null
  }) as countspaces

`

module.exports = {
  string: uglifyQueryString(query),
  parser(result) {
    return {
      countspaces: result.get('countspaces')
    }
  }
}
