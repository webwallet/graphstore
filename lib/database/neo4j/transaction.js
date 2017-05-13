'use strict'

const Session = require('./session')

class Transaction {
  constructor(driver) {
    this.session = new Session(driver)
    this.transaction = this.session.beginTransaction()
  }
  async run(query = '', params) {
    return this.transaction.run(query, params)
  }
  async commit() {
    return this.transaction.commit()
  }
  async rollback() {
    return this.transaction.rollback()
  }
}

module.exports = Transaction
