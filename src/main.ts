import { run } from './hu60wap6.js'
import { clearSession } from './session.js'

setInterval(() => {
  clearSession()
}, 1000 * 60 * 5)

run()