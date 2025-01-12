import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
//read .env
import dotenv from 'dotenv'
dotenv.config()

// Required for resolving file paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000
const FILE_PATH = path.join(__dirname, 'CaddyGen.json')

const emptyJson = []

// Middleware to parse JSON body
app.use(bodyParser.json())

// Add CORS headers middleware
app.use((req, res, next) => {
  if (process.env.VITE_FRONTEND_URL) {
    res.header('Access-Control-Allow-Origin', process.env.VITE_FRONTEND_URL)
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    next()
  }
})

//endpoint to save the json
app.post('/api/save-data', async (req, res) => {
  const jsonData = req.body
  try {
    await fs.writeFile(FILE_PATH, JSON.stringify(jsonData, null, 2))
    res.send({ message: 'JSON saved successfully' })
  } catch (err) {
    console.error('Error saving JSON:', err)
    res.status(500).send({ message: 'Failed to save JSON' })
  }
})

// Endpoint to retrieve the JSON
app.get('/api/read-data', async (req, res) => {
  try {
    const data = await fs.readFile(FILE_PATH, 'utf-8')
    res.send(JSON.parse(data))
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.send(emptyJson)
    } else {
      res.send(emptyJson)
    }
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
