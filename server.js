const http = require('http')
const parseCookie = require('./parseCookie')

const fse = require('fs-extra')
const path = require('path')

const qs = require('querystring')
const keyword = '123456'

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
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      if (req.cookie.auth) {
        res.end(`Hello! You should see this page after auth pass!`)
      } else {
        // 跳转到认证页面
        const content = await fse.readFile('./static/auth.html')
        res.end(content)
      }
    } else if (req.url.includes('/validate') && req.method === 'POST') {
      // 这里读出post data
      let body = ''
      req.on('data', data => {
        body += data
      })
      req.on('end', () => {
        const POST = qs.parse(body)
        if (POST.valueContainer === keyword) {
          req.cookie.auth = true
          res.writeHead(302, {
            Location: encodeURI('/')
          })
          res.end('')
          // res.writeHead(200, { 'Content-Type': 'text/plain' })
          // res.end('validate success!')
        } else {
          res.writeHead(302, {
            Location: encodeURI('/')
          })
          res.end('validate error!')
        }
      })
    } else if (req.url.includes('/static') && req.method === 'GET') {
      const fileName = path.join(__dirname, '.', req.url)
      const extensionFileName = req.url.match(/\.([a-zA-Z0-9]*)$/)[1]
      switch (extensionFileName) {
        case 'css':
          res.writeHead(200, {
            'Content-Type': 'text/css; charset="utf-8"'
          })
          break
        case 'png':
          res.writeHead(200, `Content-Type: image/${extensionFileName}`)
          break
        case 'jpeg':
          res.writeHead(200, `Content-Type: image/${extensionFileName}`)
          break
        case 'mp3':
          res.writeHead(200, `Content-Type: video/${extensionFileName}`)
          break
        case 'wav':
          res.writeHead(200, `Content-Type: video/${extensionFileName}`)
          break
        case 'ogg':
          res.writeHead(200, `Content-Type: image/${extensionFileName}`)
          break
        default:
          res.writeHead(200, { 'Content-Type': 'text/plain' })
          break
      }
      const content = await fse.readFile(fileName)
      res.end(content)
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(`page not found`)
    }
  })
  .listen(8082)
console.log('server running on port 8082')
