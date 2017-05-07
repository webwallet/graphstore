'use strict'

const queries = require('./queries')

const Connection = require('./connection')
const Session = require('./session')
const Transaction = require('./transaction')

class Graphstore {
  static async connect(params) {
    let driver = await Connection.open(params)
    let session = driver.session()

    let db = {
      query: async (name, params, options = {}) => {
        let query = queries[name]
        if (!query) throw new Error('invalid-query')
        let transaction = options.transaction ||
          new Transaction(options.session || session)

        let result = await transaction.run(query.string, params)
        result.records = result.records.map(record => query.parser(record))

        return {transaction, result}
      }
    }

    return db
  }
  static async session(driver) {
    return await new Session(driver)
  }
}

module.exports = Graphstore
