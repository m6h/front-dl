const { exec, spawn } = require('child_process')
const { posix } = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { io } = require('../app')

function formatPath(queryPath) {
    // prepend root directory. return error if any '/../' in path. clean up path using normalize.
    // trailing slash is required to correctly match a query string beginning with '../'
    const path = '/mnt/ydl/' + queryPath
    if (path.match(/\/\.\.\//)) {
        throw new Error("Navigation to parent directories is not allowed")
    } else {
        return posix.normalize(path)
    }
}

// Get folder names for the directory browser
exports.browse = (req, res) => {
    try {
        const path = formatPath(req.query.path)

        exec(`find "${path}" -maxdepth 1 -mindepth 1 -type d -printf '%f/'`, (error, stdout, stderr) => {
            res.json(stdout)
        })
    } catch (error) {
        console.error(error)
        res.json('')
    }
}

// Fetch video thumbnail
exports.thumbnail = (req, res) => {
    // Query string: {url: ''}
    try {
        // Hash query string url with sha256 to generate file name in cache folder
        // Create hash object and input (update) the string to hash
        // Calculate output (digest) of the hash function as a standard hex string
        const fileName = crypto.createHash('sha256').update(req.query.url).digest('hex')

        const filePath = `./public/cache/${fileName}.jpg`

        // If image at calculated path can be read (it exists) then return existing image path
        fs.access(filePath, fs.constants.R_OK, (error) => {
            if (error) {
                // Image can't be read (it doesn't exist). Fetch thumbnail image
                exec(`youtube-dl --write-thumbnail --skip-download -o "${filePath}" ${req.query.url}`, (error, stdout, stderr) => {
                    // If valid url respond with path to image
                    error ? res.json('') : res.json(filePath)
                })
            } else {
                // Image already exists. Respond with path to image
                res.json(filePath)
            }
        })
    } catch (error) {
        console.error(error)
        res.json('')
    }
}

// Download
exports.download = (req, res) => {
    // Query string: {url: '', type: '', tags: {artist: '', title: '', genre: ''}, path: '', socketId: ''}
    // Client sends Socket.io id so server can emit events to private room (Each socket automatically joins a room identified by its id)

    try {
        const path = formatPath(req.query.path)
        
        // Download the video with youtube-dl. If audio then also add metadata tags using AtomicParsley
        if(req.query.type == 'audio') {
            var youtubeDl = spawn('youtube-dl', ['-f', 'bestaudio[ext=m4a]', '--embed-thumbnail', '-o', `${path}.m4a`, `${req.query.url}`])
            
            // Set encoding so outputs can be read
            youtubeDl.stdout.setEncoding('utf-8')
            youtubeDl.stderr.setEncoding('utf-8')

            // Emit command stdout stream to socket, and console log
            youtubeDl.stdout.on('data', data => {
                // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
                //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
                (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : console.log(`ydl stdout: ${data}`)

                io.to(req.query.socketId).emit('console_stdout', data)
            })

            // Log stderr if exists
            youtubeDl.stderr.on('data', data => {
                console.error(`ydl stderr: ${data}`)
            })

            // Once youtube-dl download is complete, add metadata to audio file, send http response, emit "Done" message to client socket, and log exit code
            youtubeDl.on('close', exitCode => {
                console.log(`youtube-dl exited with code ${exitCode}`)
                io.to(req.query.socketId).emit('console_stdout', 'Done')

                var atomicParsley = spawn('AtomicParsley', [`${path}.m4a`, '--overWrite', '--artist', `${req.query.tags.artist}`, '--title', `${req.query.tags.title}`, '--genre', `${req.query.tags.genre}`])
                
                // Set encoding so outputs can be read
                atomicParsley.stdout.setEncoding('utf-8')
                atomicParsley.stderr.setEncoding('utf-8')

                // stdout to log
                atomicParsley.stdout.on('data', data => {
                    console.log(`AP stdout: ${data}`)
                })

                 // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    console.error(`AP stderr: ${data}`)
                })

                atomicParsley.on('close', exitCode => {
                    console.log(`AtomicParsley exited with code ${exitCode}`)
                    res.json(exitCode)
                })
            })
        } else if(req.query.type == 'video') {
            var youtubeDl = spawn('youtube-dl', ['-f', 'bestvideo[height<=?1080]+bestaudio', '--merge-output-format', 'mkv', '--write-thumbnail', '-o', `${path}.mkv`, `${req.query.url}`])
            
            // Set encoding so outputs can be read
            youtubeDl.stdout.setEncoding('utf-8')
            youtubeDl.stderr.setEncoding('utf-8')

            // Emit command stdout stream to socket, and console log
            youtubeDl.stdout.on('data', data => {
                // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
                //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
                (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : console.log(`ydl stdout: ${data}`)
                
                io.to(req.query.socketId).emit('console_stdout', data)
            })

            // Log stderr if exists
            youtubeDl.stderr.on('data', data => {
                console.error(`ydl stderr: ${data}`)
            })

            // Send http response once download has completed, emit "Done" message to client socket, and log exit code
            youtubeDl.on('close', exitCode => {
                console.log(`youtube-dl exited with code ${exitCode}`)
                io.to(req.query.socketId).emit('console_stdout', 'Done')
                res.json(exitCode) 
            })
        } else {
            res.json('')
        }
    } catch (error) {
        console.error(error)
        res.json('')
    }
}