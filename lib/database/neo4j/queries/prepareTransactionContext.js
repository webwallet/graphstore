'use strict'

const uglifyQueryString = require('*lib/utils/uglifyQueryString')

/** Initializes a Countspace by creating the required nodes and relationships
 * (or returns the existing ones if applicable)
 * nodes: Countspace (x1), Address (x1), Index (x1)
 **/
const query = `
  unwind {countspaces} as id
  merge (countspace:Countspace {id: id})
  merge (issuer:Address {id: id})
  merge (countspace)-[:Issuer]->(issuer)
  merge (issuer)-[:Outputs {id: id}]->(outputs:Index)
  return collect({
    id: id,
    node: countspace is not null,
    address: issuer is not null,
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
