'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as params
  merge (countspace:Countspace {id: params.symbol}) 
  with * unwind params.outputs as thisOutput
  optional match (countspace)-[:Addresses]->(address:Address {id: thisOutput.address})
  with *, thisOutput.sources + [''] as pointers
  unwind [pointer in pointers | split(pointer, '::')] as pointer
  optional match (address)-[output:Outputs]->(source:Transaction) 
  where source.id = pointer[0] and output.id = toInteger(pointer[1])
  and not (source)<-[:Sources {id: output.id}]-(:Transaction) set source.LOCKED = true
  with countspace, params, collect(distinct source) as sources,
  collect(distinct source.id + '::' + output.id) as pointers

  create (transaction:Transaction {id: $id, time: timestamp()})
  foreach (_ in case when size(params.sources)=size(pointers) then [1] else [] end |
    foreach (input in params.inputs | merge (transaction)-[:Inputs]->(:IOU {id: input.hash}))
    foreach (output in params.outputs |
      merge (countspace)-[:Addresses]->(address:Address {id: output.address})
      merge (address)-[:Outputs {id: toInteger(output.index)}]->(transaction)
      foreach (pointer in [source in output.sources | split(source, '::')] |
        foreach (funding in [source in sources where pointer[0] = source.id] |
          merge (transaction)-[:Sources {id: toInteger(pointer[1])}]->(funding))
      )
    )
  )

  foreach (source in sources | remove source.LOCKED)
  with transaction, transaction.id as id, countspace.id as symbol, params,
    [(transaction)-[input:Inputs]->(iou) | iou.id] as inputs,
    [(transaction)-[source:Sources]->(funding) | funding.id + '::' + source.id] as sources,
    [(transaction)<-[output:Outputs]-(address) | address.id + '::' + output.id] as newputs
  return id, symbol, inputs, sources, [output in params.outputs where
    (output.address + '::' + toInteger(output.index)) in newputs | output] as outputs
`

module.exports = {
  string: uglifyQueryString(query),
  parser(result) {
    return {
      id: result.get('id'),
      symbol: result.get('symbol'),
      inputs: result.get('inputs'),
      sources: result.get('sources'),
      outputs: result.get('outputs')
    }
  }
}
