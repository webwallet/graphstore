'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  unwind $countspaces as params
  merge (countspace:Countspace {id: params.symbol}) with *
  unwind params.inputs as input create (iou:IOU {id: input.value})
  with *, collect(iou) as inputs, params.sources as sources
  unwind (case sources when [] then [''] else sources end) as pointer
  optional match (countspace)-[:Transactions*1..2]->(source:Transaction)
  <-[output:Outputs]-() where (source.id + '::' + output.id) = pointer
  and not (source)<-[:Sources]-(:Transaction) set source.LOCKED = true
  with countspace, params, inputs, collect(distinct source) as sources,
  collect(distinct source.id + '::' + output.id) as pointers

  merge (countspace)-[:Transactions]->(transaction:Transaction {id: $id})
  foreach (_ in case when size(params.sources)=size(pointers) then [1] else [] end |
    foreach (input in inputs | merge (transaction)-[:Inputs]->(input))
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
  with transaction, transaction.id as id, countspace.id as countspace,
    [(transaction)-[input:Inputs]->(iou) | iou.id] as inputs,
    [(transaction)-[source:Sources]->(funding) | funding.id + '::' + source.id] as sources,
    [(transaction)<-[output:Outputs]-(address) | address.id + '::' + output.id] as outputs
  return id, countspace, inputs, sources, outputs
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
