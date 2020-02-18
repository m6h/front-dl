const { exec, spawn, spawnSync } = require('child_process')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { io } = require('../app')
const util = require('util')

function checkPath(queryPath) {
    // Return error if any '/../' in path. clean up path using normalize.
    // Trailing slash in desired root directory is required to correctly match a query string beginning with '../'
    
    // const location = '/mnt/ydl/' + queryPath
    if (queryPath.match(/\/\.\.\//)) {
        throw new Error("Cannot navigate to parent directories")
    } else {
        return path.posix.normalize(queryPath)
    }
}

// Get folder names for the directory browser
exports.browse = (req, res) => {
    const path = checkPath('/mnt/ydl/' + req.query.path)

    exec(`find "${path}" -maxdepth 1 -mindepth 1 -type d -printf '%f/'`, (error, stdout, stderr) => {
        error ? console.error(error) : res.json(stdout)
    })
}

// Fetch video thumbnail
exports.getThumbnail = (req, res) => {
    // Query string: {url: ''}

    const q = req.query

    if (q.url) {
        // Hash query string url with sha256 to generate file name in cache folder
        // Create hash object and input (update) the string to hash
        // Calculate output (digest) of the hash function as a standard hex string
        const fileName = crypto.createHash('sha256').update(q.url).digest('hex')

        const filePath = `./public/cache/${fileName}.jpg`

        // If image at calculated path can be read (it exists) then return existing image path
        fs.access(filePath, fs.constants.R_OK, (error) => {
            if (error) {
                // Image can't be read (it doesn't exist). Fetch thumbnail image
                var youtubeDl = spawn('youtube-dl', ['--write-thumbnail', '--skip-download', '-o', `${filePath}`, `${q.url}`])

                // Set encoding so outputs can be read
                youtubeDl.stderr.setEncoding('utf-8')

                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    console.error(`ydl stderr: ${data}`)
                })

                // Respond with path to thumbnail
                youtubeDl.on('close', exitCode => {
                    console.log(`youtube-dl exited with code ${exitCode}`)
                    res.json(filePath)
                })
            } else {
                // Image already exists. Respond with path to image
                res.json(filePath)
            }
        })
    } else {
        res.json('')
    }
}

// Delete all .jpg's from the cache folder
exports.clearThumbnailCache = (req, res) => {
    exec('rm ./public/cache/*.jpg', (error, stdout, stderr) => {
        if (error) {
            console.error(error)
            res.json('')
        } else {
            res.json('')
        }
    })
}

// Download
exports.download = (req, res) => {
    // Query string: {url: '', type: '', tags: {artist: '', title: '', genre: ''}, path: '', fileName: '', socketId: ''}

    // Client sends Socket.io id so server can emit events to private room (Each socket automatically joins a room identified by its id)
    // path string 'false' = download to browser.
    
    const q = req.query

    // Format and validate path
    // If downloading to the browser set the path to a cache, otherwise assume downloading to a directory.
    if (q.path == 'false') {
        // To the browser
        q.htmlDownload = true
        q.path = checkPath(__basedir + '/public/cache/' + q.fileName)
    } else {
        // To directory
        q.path = checkPath('/mnt/ydl/' + q.path + '/' + q.fileName)
    }

    // Ensure minimum required query strings have values
    if (q.url && ((q.type == 'audio' && q.tags.artist && q.tags.title) || q.type == 'video') && q.path && q.socketId) {
        res.json('')

        // Download the video with youtube-dl. If audio then also add metadata tags using AtomicParsley
        switch (q.type) {
            case 'audio':
                var youtubeDl = spawn('youtube-dl', ['-f', 'bestaudio[ext=m4a]', '--embed-thumbnail', '-o', `${q.path}.m4a`, `${q.url}`])
                
                // Set encoding so outputs can be read
                youtubeDl.stdout.setEncoding('utf-8')
                youtubeDl.stderr.setEncoding('utf-8')

                // Emit command stdout stream to socket, and console log
                youtubeDl.stdout.on('data', data => {
                    // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
                    //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
                    (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : console.log(`ydl stdout: ${data}`)

                    io.to(q.socketId).emit('console_stdout', data)
                })

                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    console.error(`ydl stderr: ${data}`)
                })

                // Once youtube-dl download is complete, add metadata to audio file, send http response, emit "Done" message to client socket, and log exit code
                youtubeDl.on('close', exitCode => {
                    console.log(`youtube-dl exited with code ${exitCode}`)

                    var atomicParsley = spawn('AtomicParsley', [`${q.path}.m4a`, '--overWrite', '--artist', `${q.tags.artist}`, '--title', `${q.tags.title}`, '--genre', `${q.tags.genre}`])
                    
                    // Set encoding so outputs can be read
                    atomicParsley.stdout.setEncoding('utf-8')
                    atomicParsley.stderr.setEncoding('utf-8')

                    // Emit command stdout stream to socket, and console log
                    atomicParsley.stdout.on('data', data => {
                        console.log(`AP stdout: ${data}`)
                        io.to(q.socketId).emit('console_stdout', data)
                    })

                    // Log stderr if exists
                    youtubeDl.stderr.on('data', data => {
                        console.error(`AP stderr: ${data}`)
                    })

                    atomicParsley.on('close', exitCode => {
                        console.log(`AtomicParsley exited with code ${exitCode}`)
                        io.to(q.socketId).emit('console_stdout', 'Done')

                        // Tell client that download is complete. Emit cache path if downloading to browser.
                        if (q.htmlDownload) {
                            io.to(q.socketId).emit('download_complete', `${q.fileName}.m4a`)
                        } else {
                            io.to(q.socketId).emit('download_complete', 'Done')
                        }
                    })
                })
                break
            case 'video':
                var youtubeDl = spawn('youtube-dl', ['-f', 'bestvideo[height<=?1080]+bestaudio', '--merge-output-format', 'mkv', '--write-thumbnail', '-o', `${q.path}.mkv`, `${q.url}`])
        
                // Set encoding so outputs can be read
                youtubeDl.stdout.setEncoding('utf-8')
                youtubeDl.stderr.setEncoding('utf-8')
        
                // Emit command stdout stream to socket, and console log
                youtubeDl.stdout.on('data', data => {
                    // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
                    //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
                    (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : console.log(`ydl stdout: ${data}`)
                    
                    io.to(q.socketId).emit('console_stdout', data)
                })
        
                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    console.error(`ydl stderr: ${data}`)
                })
        
                // Send http response once download has completed, emit "Done" message to client socket, and log exit code
                youtubeDl.on('close', exitCode => {
                    console.log(`youtube-dl exited with code ${exitCode}`)
                    io.to(q.socketId).emit('console_stdout', 'Done')
                    
                    // Tell client that download is complete. Emit cache path if downloading to browser.
                    if (q.htmlDownload) {
                        io.to(q.socketId).emit('download_complete',  `${q.fileName}.mkv`)
                    } else {
                        io.to(q.socketId).emit('download_complete', 'Done')
                    }
                })
                break
        }
    } else {
        res.status(400).send('Bad Request')
    }
}

// Download a file from the cache as an attachment
exports.downloadFromCache = (req, res) => {
    const q = req.params

    // Set root path and response header so file is downloaded as an attachment instead of opened in browser
    var options = {
        root: path.join(__basedir, 'public', 'cache'),
        headers: {
            'Content-Disposition': `attachment; filename="${q.fileName}"`
        }
    }

    res.sendFile(q.fileName, options, error => {
        if (error) {
            console.error(error)
            res.status(400).send('Bad Request')
        } else {
            console.log(`Sent file "${q.fileName}" from cache`)
        }
    })
}

// Get the metadata of a video
exports.metadata = (req, res) => {
    var youtubeDl = spawnSync('youtube-dl', ['--dump-json', '--skip-download', `${req.query.url}`], {encoding: 'utf-8'})

    // Respond with output unless error
    if (youtubeDl.error) {
        console.error(`ydl error: ${youtubeDl.error}`)
        res.json('')
    } else {
        res.json(JSON.parse(youtubeDl.stdout))
    }
}

// Get youtube-dl version
exports.version = (req, res) => {
    exec('youtube-dl --version', (error, stdout, stderr) => {
        if (error) {
            console.error(error)
            res.json('Unknown')
        } else {
            res.json(stdout)
        }
    })
}

// Update youtube-dl
exports.update = (req, res) => {
    exec('curl -L https://yt-dl.org/downloads/latest/youtube-dl > /usr/local/bin/youtube-dl && chmod +xr /usr/local/bin/youtube-dl', (error, stdout, stderr) => {
        if (error) {
            console.error(error)
            res.json('')
        } else {
            res.json(stdout)
        }
    })
}