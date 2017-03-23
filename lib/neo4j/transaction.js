'use strict'

const neo4j = require('neo4j-driver')

class Transaction {
  constructor({ driver, session }) {
    this.driver = driver
    this.session = session || this.driver.session()
    this.transaction = this.session.beginTransaction()
  }
  async run(query = '', params) {
    return this.transaction.run(query, params)
  }
  async commit() {
    return this.transaction.commit()
  }
  async rollback() {
    return this.transaction.callback()
  }
}

module.exports = (params) => new Transaction(params)
