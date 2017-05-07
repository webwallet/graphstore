'use strict'

class Session {
  constructor(driver) {
    return driver.session()
  }
}

module.exports = Session
