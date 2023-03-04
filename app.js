require('dotenv').config()

const sgMail = require('@sendgrid/mail')
const http = require('http')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const authUrl = process.env.AUTH_URL

const server = http.createServer(async (req, res) => {
  const url = req.url
  const appName = req.headers['appname']
  const auth = req.headers['authorization']
  const token = auth && auth.split(' ')[1]

  if (!token) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'text/plain')
    res.end('Unauthorized')
    return
  }

  if (!req.headers['content-type'] || req.headers['content-type'] !== 'application/json') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain')
    res.end('Bad Request')
    return
  }

  if (!req.method || req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'text/plain')
    res.end('Method Not Allowed')
    return
  }

  const body = {}
  req.on('data', (chunk) => {
    Object.assign(body, JSON.parse(chunk))
  })

  req.on('end', async () => {
    if (url === '/api/email/v1') {
      try {
        const response = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            AppName: appName,
            Authorization: `Bearer: ${token}`,
          },
        })
  
        if (response.statusCode >= 400) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'text/plain')
          res.end('Unauthorized')
          return
        }
  
        if (!response.ok) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'text/plain')
          res.end('Internal Server Error')
          return
        }
  
        const msg = {
          to: body.to,
          from: 'cotter.github45@gmail.com',
          subject: body.subject,
          html: body.html,
        }
  
        await sgMail.send(msg)
  
        res.statusCode = 201
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'Success' }))
        return
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain')
        res.end('Internal Server Error')
        return
      }
    }
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    res.end('Not Found')
  })
})

server.listen(8081, () => {
  console.log('Server running at http://localhost:8081/')
})