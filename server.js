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
    // '/' or '/?qs=value', but not '/url/'
    if (/^\/($|\?.*$)/.test(req.url) && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // 如果根据cookie已经通过认证
      if (req.cookie.auth) {
        const htmlContent = await fse.readFile(
          path.join(__dirname, './static/main.html')
        )
        const jsonContent = await fse.readJson(
          path.join(__dirname, './content.json'),
          { encoding: 'utf-8' }
        )
        const letterContent = jsonContent.content
        const outputString = htmlContent
          .toString()
          .replace(
            /<div class="scrollContainer">\s*<\/div>/,
            `<div class="scrollContainer">${letterContent}</div>`
          )
        res.end(Buffer.from(outputString))
      } else {
        // 跳转到认证页面
        const content = await fse.readFile(
          path.join(__dirname, './static/auth.html')
        )
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
            Location: encodeURI(`/?time=${POST.currentTime}`)
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
          res.writeHead(200, {
            'Content-Type': `audio/${extensionFileName}`,
            'Accept-Ranges': 'bytes'
          })
          return
        case 'ogg':
          res.writeHead(
            200,
            `Content-Type: image/${extensionFileName}, Accept-Ranges: bytes`
          )
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
