module.exports = function(cookie) {
  if (!cookie) {
    return {}
  }
  let res = {}
  cookie.split(';').forEach(pair => {
    const [name, value] = pair.split('=')
    res[name.trim()] = value.trim()
  })
  return res
}
