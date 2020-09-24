'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as params
  merge (countspace:Countspace {id: params.symbol}) 
  with * unwind params.outputs as thisOutput
  optional match (countspace)-[:Addresses]->(address:Address)
  where address.id = thisOutput.address set address.writeLock = timestamp()
  with *, thisOutput.sources + [''] as pointers
  unwind [pointer in pointers | split(pointer, '::')] as pointer
  with *, [
    (address)-[output:Unspent]->(source:Transaction)
    where source.id = pointer[0] and output.id = toInteger(pointer[1])
    and not (source)<-[:Sources {id: output.id}]-(:Transaction)
    | {node: source, unspent: output}
  ] as _sources
  with countspace, params, reduce(S = [], s in collect(_sources) | S + s) as sources,
    reduce(P = [], p in [output in params.outputs | output.sources] | P + p) as paramsPointers
  with *, [source in sources | source.node] as sourceNodes,
    [source in sources | source.unspent] as unspentOutputs

  create (transaction:Transaction {id: $id, time: timestamp()})
  foreach (_ in case when size(unspentOutputs)=size(paramsPointers) then [1] else [] end |
    foreach (input in params.inputs | merge (transaction)-[:Inputs]->(:IOU {id: input.hash}))
    foreach (unspent in unspentOutputs | delete unspent)
    foreach (output in params.outputs |
      foreach (pointer in [source in output.sources | split(source, '::')] |
        foreach (funding in [source in sourceNodes where pointer[0] = source.id] |
          merge (transaction)-[:Sources {id: toInteger(pointer[1])}]->(funding)))
    )
    foreach (output in params.outputs |
      merge (countspace)-[:Addresses]->(address:Address {id: output.address})
      merge (address)-[:Outputs {id: toInteger(output.index)}]->(transaction)
      merge (address)-[:Unspent {id: toInteger(output.index)}]->(transaction)
    )
  )

  foreach (source in sources | remove source.node.LOCKED)
  with transaction, transaction.id as id, countspace.id as symbol, params,
    [(transaction)-[input:Inputs]->(iou) | iou.id] as inputs,
    [(transaction)-[source:Sources]->(funding) | funding.id + '::' + source.id] as sources,
    [(transaction)<-[output:Unspent]-(address) | address.id + '::' + output.id] as newputs
  return id, symbol, inputs, sources, [output in params.outputs where
    (output.address + '::' + toInteger(output.index)) in newputs | output] as outputs
`

module.exports = {
  txmode: 'write',
  string: uglifyQueryString(query),
  parser: (result) =>{
    return {
      id: result.get('id'),
      symbol: result.get('symbol'),
      inputs: result.get('inputs'),
      sources: result.get('sources'),
      outputs: result.get('outputs')
    }
  }
}
