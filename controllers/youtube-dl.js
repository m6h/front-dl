const { exec, spawn, spawnSync } = require('child_process')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { io } = require('../app')
const util = require('util')

function checkPath(queryPath) {
    // Return error if any '/../' in path. clean up path using normalize.
    // Trailing slash in desired root directory is required to correctly match a query string beginning with '../'
    
    if (queryPath.match(/\/\.\.\//)) {
        throw new Error("Cannot navigate to parent directories")
    } else {
        return path.posix.normalize(queryPath)
    }
}

// Get folder names for the directory browser
exports.browse = (req, res) => {
    const q = req.query

    // Check if "path" query string exists. Empty string is valid.
    if (Object.keys(q).includes('path')) {
        const path = checkPath('/media/' + q.path)
    
        exec(`find "${path}" -maxdepth 1 -mindepth 1 -type d -printf '%f/'`, (error, stdout, stderr) => {
            if (error) {
                log('find', error)
                res.status(400).send('Bad Request')
            } else {
                res.json(stdout)
            }
        })
    } else {
        res.status(400).send('Bad Request')
    }
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
                var youtubeDl = spawn('youtube-dl', [
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--write-thumbnail',
                    '--skip-download',
                    '-o', `${filePath}`,
                    `${q.url}`
                ])

                // Set encoding so outputs can be read
                youtubeDl.stderr.setEncoding('utf-8')

                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    log('youtube-dl', data)
                })

                // Respond with path to thumbnail
                youtubeDl.on('close', exitCode => {
                    log('youtube-dl', exitCode)
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
            log('rm', error)
            res.json('')
        } else {
            res.json('')
        }
    })
}

// Download
exports.download = (req, res) => {
    // Query string: {url: '', format: '', tags: {artist: '', title: '', genre: ''}, path: '', fileName: '', socketId: ''}

    // Client sends Socket.io id so server can emit events to private room (Each socket automatically joins a room identified by its id)
    // path string 'false' = download to browser.
    
    var q = req.query

    // Format and validate path
    // If downloading to the browser set the path to a cache, otherwise assume downloading to a directory.
    if (q.path == 'false') {
        // To the browser
        q.htmlDownload = true
        q.path = checkPath(__basedir + '/public/cache/' + q.fileName)
    } else {
        // To directory
        q.path = checkPath('/media/' + q.path + '/' + q.fileName)
    }

    // Ensure minimum required query strings have values
    if (q.url && ((q.format == 'audio' && q.tags.artist && q.tags.title) || q.format == 'video') && q.fileName && q.socketId) {
        res.json('')

        // Download the video with youtube-dl. If audio then also add metadata tags.
        switch (q.format) {
            case 'audio':
                // Prefer audio formats in this order: .m4a > .mp3 > other
                var youtubeDl = spawn('youtube-dl', [
                    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--embed-thumbnail',
                    '--no-playlist',
                    '-o', `${q.path}.%(ext)s`,
                    `${q.url}`
                ])
                
                // Set encoding so outputs can be read
                youtubeDl.stdout.setEncoding('utf-8')
                youtubeDl.stderr.setEncoding('utf-8')

                // Emit command stdout stream to socket, and console log
                youtubeDl.stdout.on('data', data => {
                    // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
                    //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
                    (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : log('youtube-dl', data)

                    // Parse youtube-dl output for destination (file name with extension)
                    //   then get just the extension using the "path" module. Allows using any file extension.
                    const match = data.match(/.*Destination: .*/)
                    match ? q.fileExtension = path.extname(match[0]) : null

                    io.to(q.socketId).emit('console_stdout', data)
                })

                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    log('youtube-dl', data)
                })

                // Once youtube-dl download is complete, add metadata to audio file
                youtubeDl.on('close', exitCode => {
                    log('youtube-dl', exitCode)

                    var ffmpeg = spawn('ffmpeg', [
                        '-i', `${q.path}${q.fileExtension}`, '-y',
                        '-codec', 'copy',
                        '-metadata', `artist=${q.tags.artist}`,
                        '-metadata', `title=${q.tags.title}`,
                        '-metadata', `genre=${q.tags.genre}`,
                        `${q.path}-tmp${q.fileExtension}`
                    ])
                    
                    // Set encoding so outputs can be read
                    ffmpeg.stdout.setEncoding('utf-8')
                    ffmpeg.stderr.setEncoding('utf-8')

                    // Emit command stdout stream to socket, and console log
                    ffmpeg.stdout.on('data', data => {
                        log('ffmpeg', data)
                        io.to(q.socketId).emit('console_stdout', data)
                    })

                    // Log stderr if exists
                    ffmpeg.stderr.on('data', data => {
                        log('ffmpeg', data)
                    })

                    ffmpeg.on('close', exitCode => {
                        // Replace original file with temporary file from ffmpeg
                        var mv = spawn('mv', [`${q.path}-tmp${q.fileExtension}`, `${q.path}${q.fileExtension}`])

                        mv.on('close', () => {
                            log('ffmpeg', exitCode)
                            io.to(q.socketId).emit('console_stdout', 'Download complete')

                            // Tell client that download is complete. Emit cache path if downloading to browser.
                            if (q.htmlDownload) {
                                io.to(q.socketId).emit('download_complete', `${q.fileName}${q.fileExtension}`)
                            } else {
                                io.to(q.socketId).emit('download_complete', 'Download complete')
                            }
                        })
                    })
                })
                break
            case 'video':
                var youtubeDl = spawn('youtube-dl', [
                    '-f', 'bestvideo[height<=?1080]+bestaudio',
                    '--merge-output-format', 'mkv',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--write-thumbnail',
                    '--no-playlist',
                    '-o', `${q.path}.mkv`,
                    `${q.url}`
                ])
        
                // Set encoding so outputs can be read
                youtubeDl.stdout.setEncoding('utf-8')
                youtubeDl.stderr.setEncoding('utf-8')
        
                // Emit command stdout stream to socket, and console log
                youtubeDl.stdout.on('data', data => {
                    // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
                    //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
                    (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : log('youtube-dl', data)
                    
                    io.to(q.socketId).emit('console_stdout', data)
                })
        
                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    log('youtube-dl', data)
                })
        
                // Send http response once download has completed, emit "Done" message to client socket, and log exit code
                youtubeDl.on('close', exitCode => {
                    log('youtube-dl', exitCode)
                    io.to(q.socketId).emit('console_stdout', 'Download complete')
                    
                    // Tell client that download is complete. Emit cache path if downloading to browser.
                    if (q.htmlDownload) {
                        io.to(q.socketId).emit('download_complete',  `${q.fileName}.mkv`)
                    } else {
                        io.to(q.socketId).emit('download_complete', 'Download complete')
                    }
                })
                break
        }
    } else {
        res.status(400).send('Bad Request')
    }
}

// Download a file from the cache as an attachment, then delete it.
exports.downloadFromCache = (req, res) => {
    const q = req.params

    // Set root path and response header so file is downloaded as an attachment instead of opened in browser.
    // fileName contains the file extension.
    var options = {
        root: path.join(__basedir, 'public', 'cache'),
        headers: {
            'Content-Disposition': `attachment; filename="${q.fileName}"`
        }
    }

    res.sendFile(q.fileName, options, error => {
        if (error) {
            log('res.sendFile', error)
            res.status(400).send('Bad Request')
        } else {
            log('res.sendFile', q.fileName)
            spawn('rm', [path.join(__basedir, 'public', 'cache', `${q.fileName}`)])
        }
    })
}

// Get the metadata of a video
exports.metadata = (req, res) => {
    var youtubeDl = spawn('youtube-dl', [
        '--cookies', '/etc/youtube-dl/cookies',
        '--ignore-errors',
        '--dump-single-json',
        '--skip-download',
        `${req.query.url}`
    ])
    var output = ''

    // Set encoding so outputs can be read
    youtubeDl.stdout.setEncoding('utf-8')

    // Log stderr if exists
    youtubeDl.stderr.on('data', data => {
        log('youtube-dl', data)
    })

    // Collect stdout stream in variable
    youtubeDl.stdout.on('data', data => {
        output = output + data
    })

    // Respond with final output when process is completed
    youtubeDl.on('close', exitCode => {
        log('youtube-dl', exitCode)
        output ? res.json(JSON.parse(output)) : res.json('')
    })

}

// Get youtube-dl version
exports.version = (req, res) => {
    exec('youtube-dl --version', (error, stdout, stderr) => {
        if (error) {
            log('youtube-dl', error)
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
            log('youtube-dl update', error)
            res.json('')
        } else {
            res.json(stdout)
        }
    })
}