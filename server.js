const http = require('http')
const parseCookie = require('./parseCookie')
const fse = require('fs-extra')
const storage = {}
http
  .createServer(async (req, res) => {
    const cookies = parseCookie(req.headers.cookie)
    if (cookies.sessionTicket) {
      // 如果storage意外丢失(例如服务器重启), 尝试恢复
      if (storage[cookies.sessionTicket]) {
        req.cookie = storage[cookies.sessionTicket]
      } else {
        storage[cookies.sessionTicket] = {}
        req.cookie = storage[cookies.sessionTicket]
      }
    } else {
      const randomTicket = Math.random()
        .toString(16)
        .slice(2)

      res.setHeader('Set-Cookie', [
        `sessionTicket=${randomTicket}; Max-Age=${60 * 60 * 24 * 30}; httpOnly`
      ])
      storage[randomTicket] = {}
      req.cookie = storage[randomTicket]
    }
    // if (req.cookie.visitCount) {
    //   req.cookie.visitCount++
    // } else {
    //   req.cookie.visitCount = 1
    // }
    if (req.url === '/' ) {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      if (req.cookie.auth) {
        res.end(
          `Hello world!\nyou have visit this page ${
            req.cookie.visitCount
          } time(s)`
        )
      } else {
        const content = await fse.readFile('./static/auth.html')
        res.end(content)
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(
        `page not found`
      )
    }
  })
  .listen(8082)
console.log('server running on port 8082')
