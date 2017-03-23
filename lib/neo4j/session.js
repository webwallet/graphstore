'use strict'

const neo4j = require('neo4j-driver')

class Session {
  constructor({ driver }) {
    this.session = driver.session()
  }
  async run({ query, params }) {
    return this.session.run(query, params)
  }
}

module.exports = (params) => new Session(params)
