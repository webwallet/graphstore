'use strict'

const uglifyQueryString = require('../utils/uglifyQueryString')

const query = `
  match (iou:IOU) where iou.id = $iou
  optional match (iou)<-[:Clears]-(txn:Transaction)
  return iou.id as iou, txn.id as txn
`

module.exports = {
  txmode: 'read',
  string: uglifyQueryString(query),
  parser(result) {
    return {
      iou: result.get('iou'),
      transaction: result.get('txn')
    }
  }
}
