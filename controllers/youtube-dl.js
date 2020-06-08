const { exec, spawn } = require('child_process')
const path = require('path')
const { io } = require('../app')
const fs = require('fs')

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
                log({app: 'find', event: 'stderr', msg: error})
                res.status(400).send('Bad Request')
            } else {
                res.json(stdout)
            }
        })
    } else {
        res.status(400).send('Bad Request')
    }
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
        res.status(200).send('OK')

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
                    (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : log({app: 'youtube-dl', event: 'stdout', msg: data})

                    // Parse youtube-dl output for destination (file name with extension)
                    //   then get just the extension using the "path" module. Allows using any file extension.
                    const match = data.match(/.*Destination: .*/)
                    match ? q.fileExtension = path.extname(match[0]) : null

                    io.to(q.socketId).emit('console_stdout', data)
                })

                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    log({app: 'youtube-dl', event: 'stderr', msg: data})
                })

                // Once download is complete, add metadata to audio file
                youtubeDl.on('close', exitCode => {
                    log({app: 'youtube-dl', event: 'close', msg: exitCode})

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

                    log({app: 'ffmpeg', event: 'stdout', msg: `Adding metadata to "${q.path}-tmp${q.fileExtension}"`})

                    // Log stderr if exists
                    // ffmpeg.stderr.on('data', data => {
                    //     log({app: 'ffmpeg', event: 'stderr', msg: data})
                    // })

                    ffmpeg.on('close', exitCode => {
                        log({app: 'ffmpeg', event: 'close', msg: exitCode})

                        // Replace original file with temporary file from ffmpeg which has the metadata embedded
                        var mv = spawn('mv', [`${q.path}-tmp${q.fileExtension}`, `${q.path}${q.fileExtension}`])

                        log({app: 'mv', event: 'stdout', msg: `"${q.path}-tmp${q.fileExtension}" "${q.path}${q.fileExtension}"`})

                        // Log stderr if exists
                        mv.stderr.on('data', data => {
                            log({app: 'mv', event: 'stderr', msg: data})
                        })

                        mv.on('close', exitCode => {
                            log({app: 'mv', event: 'close', msg: exitCode})

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
                    (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : log({app: 'youtube-dl', event: 'stdout', msg: data})
                    
                    io.to(q.socketId).emit('console_stdout', data)
                })
        
                // Log stderr if exists
                youtubeDl.stderr.on('data', data => {
                    log({app: 'youtube-dl', event: 'stderr', msg: data})
                })
        
                // Emit "Download complete" message to client socket once download has completed, and log exit code
                youtubeDl.on('close', exitCode => {
                    log({app: 'youtube-dl', event: 'close', msg: exitCode})
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

// Download playlist
exports.downloadPlaylist = (req, res) => {
    // Query string: {url: '', format: '', path: '', playlistName: '', outputTemplate: '', socketId: ''}

    // Client sends Socket.io id so server can emit events to private room (Each socket automatically joins a room identified by its id)
    var q = req.query

    // Format and validate path
    q.path = checkPath('/media/' + q.path + '/')

    // Ensure minimum required query strings have values
    if (q.url && (q.format == 'audio' || q.format == 'video') && q.playlistName && q.outputTemplate && q.socketId) {
        res.status(200).send('OK')
        var youtubeDl

        switch (q.format) {
            case 'audio':
                // Prefer audio formats in this order: .m4a > .mp3 > other
                youtubeDl = spawn('youtube-dl', [
                    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--embed-thumbnail',
                    '-o', `${q.path}${q.outputTemplate}`,
                    `${q.url}`
                ])
                break
            case 'video':
                youtubeDl = spawn('youtube-dl', [
                    '-f', 'bestvideo[height<=?1080]+bestaudio',
                    '--merge-output-format', 'mkv',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--write-thumbnail',
                    '-o', `${q.path}${q.outputTemplate}`,
                    `${q.url}`
                ])
                break
        }

        // Set encoding so outputs can be read
        youtubeDl.stdout.setEncoding('utf-8')
        youtubeDl.stderr.setEncoding('utf-8')

        // Emit command stdout stream to socket, and console log
        youtubeDl.stdout.on('data', data => {
            // Omit lines that match this regex. Avoids logging verbose download percent progress output, such as:
            //     [download] 82.3% of 142.00MiB at 12.25MiB/s ETA 00:02
            (data.match(/download/) && data.match(/at/) && data.match(/ETA/)) ? null : log({app: 'youtube-dl', event: 'stdout', msg: data})

            io.to(q.socketId).emit('console_stdout', data)
        })

        // Log stderr if exists
        youtubeDl.stderr.on('data', data => {
            log({app: 'youtube-dl', event: 'stderr', msg: data})
        })

        // Emit "Download complete" message to client socket once download has completed, and log exit code
        youtubeDl.on('close', exitCode => {
            log({app: 'youtube-dl', event: 'close', msg: exitCode})
            io.to(q.socketId).emit('console_stdout', 'Download complete')
            
            // Tell client that download is complete.
            io.to(q.socketId).emit('download_complete', 'Download complete')
        })
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
            log({app: 'res.sendFile', event: 'stderr', msg: error})
            res.status(400).send('Bad Request')
        } else {
            log({app: 'res.sendFile', event: 'info', msg: `"${q.fileName}"`})
            spawn('rm', [path.join(__basedir, 'public', 'cache', `${q.fileName}`)])
        }
    })
}

// Get the metadata of a video
exports.metadata = (req, res) => {
    var youtubeDl = spawn('youtube-dl', [
        '--cookies', '/etc/youtube-dl/cookies',
        '--ignore-errors',
        '--flat-playlist',
        '--dump-single-json',
        '--skip-download',
        `${req.query.url}`
    ])
    var output = ''

    // Set encoding so outputs can be read
    youtubeDl.stdout.setEncoding('utf-8')

    // Log stderr if exists
    youtubeDl.stderr.on('data', data => {
        log({app: 'youtube-dl', event: 'stderr', msg: data})
    })

    // Collect stdout stream in variable
    youtubeDl.stdout.on('data', data => {
        output = output + data
    })

    // Respond with final output when process is completed
    youtubeDl.on('close', exitCode => {
        log({app: 'youtube-dl', event: 'close', msg: exitCode})
        output ? res.json(JSON.parse(output)) : res.json('')
    })

}

// Get/Update cookies file used by youtube-dl
exports.getCookies = (req, res) => {
    fs.readFile('/etc/youtube-dl/cookies', 'utf-8', (error, data) => {
        if (error) {
            log({app: '/etc/youtube-dl/cookies', event: 'stderr', msg: error})
            res.status(400).send('Bad Request')
        } else {
            res.send(data)
        }
    })
}
exports.putCookies = (req, res) => {
    if (req.query.cookies) {
        fs.writeFile('/etc/youtube-dl/cookies', req.query.cookies, 'utf-8', (error) => {
            if (error) {
                log({app: '/etc/youtube-dl/cookies', event: 'stderr', msg: error})
                res.status(400).send('Bad Request')
            } else {
                res.status(200).send('OK')
            }
        })
    } else {
        res.status(400).send('Bad Request')
    }
}

// Get youtube-dl version
exports.version = (req, res) => {
    exec('youtube-dl --version', (error, stdout, stderr) => {
        if (error) {
            log({app: 'youtube-dl', event: 'stderr', msg: error})
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
            log({app: 'youtube-dl update', event: 'stderr', msg: error})
            res.json('')
        } else {
            res.json(stdout)
        }
    })
}