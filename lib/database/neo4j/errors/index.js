'use strict'

let errorCodes = {
  'Neo.ClientError.Schema.ConstraintValidationFailed': {
    message: 'constraint-validation-failed'
  }
}

function handle(error) {
  let err
  let errorCode = errorCodes[error.code]

  if (errorCode) {
    err = new Error(errorCode.message)
    err.details = {database: error}
    throw err
  } else {
    throw error
  }
}

module.exports = {
  handle
}
