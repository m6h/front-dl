const { exec, spawn } = require('child_process')
const path = require('path')
const { io } = require('../app')
const fs = require('fs')
const fsPromises = require('fs').promises

function checkPath(queryPath) {
    // Return error if any '/../' in path. clean up path using normalize.
    // Trailing slash in desired root directory is required to correctly match a query string beginning with '../'
    
    if (queryPath.match(/\/\.\.\//)) {
        throw new Error("Cannot navigate to parent directories")
    } else {
        return path.posix.normalize(queryPath)
    }
}

// Set file permissions and/or owner:group after download. Optional, only takes effect if corresponding settings have values.
function setPermissions(queryString = {}, paths = []) {
    // Set owner
    if (queryString.uid) {
        paths.map(path => {
            const chown = spawn('chown', ['--recursive', queryString.uid, path])
            log({app: 'chown', event: 'info', msg: `"${path}"`})
            
            // Log stderr if exists
            chown.stderr.setEncoding('utf-8')
            chown.stderr.on('data', data => log({app: 'chown', event: 'stderr', msg: data}))

            chown.on('close', exitCode => log({app: 'chown', event: 'close', msg: exitCode}))
        })
    }

    // Set group
    if (queryString.gid) {
        paths.map(path => {
            const chgrp = spawn('chgrp', ['--recursive', queryString.gid, path])
            log({app: 'chgrp', event: 'info', msg: `"${path}"`})
            
            // Log stderr if exists
            chgrp.stderr.setEncoding('utf-8')
            chgrp.stderr.on('data', data => log({app: 'chgrp', event: 'stderr', msg: data}))

            chgrp.on('close', exitCode => log({app: 'chgrp', event: 'close', msg: exitCode}))
        })
    }

    // Set file permissions
    if (queryString.chmod) {
        paths.map(path => {
            const chmod = spawn('chmod', ['--recursive', queryString.chmod, path])
            log({app: 'chmod', event: 'info', msg: `"${path}"`})
            
            // Log stderr if exists
            chmod.stderr.setEncoding('utf-8')
            chmod.stderr.on('data', data => log({app: 'chmod', event: 'stderr', msg: data}))

            chmod.on('close', exitCode => log({app: 'chmod', event: 'close', msg: exitCode}))
        })
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
    // Query string: {
    //     url: '', format: '', tags: {artist: '', title: '', genre: '', album: '', track: ''},
    //     path: '', fileName: '', socketId: '',
    //     writeThumbnail: 'true' or 'false',
    //     uid: '', gid: '', chmod: ''
    // }

    // Client sends Socket.io id so server can emit events to private room (Each socket automatically joins a room identified by its id).
    // Path string 'false' means download to the browser.
    
    var q = req.query
    log({app: 'api', event: 'info', msg: 'Download request query string: ' + JSON.stringify(q)})

    // Format and validate path. Appends file name to path.
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

        var youtubeDl, args

        // Download the video with youtube-dl. If audio then also add metadata tags.
        switch (q.format) {
            case 'audio':
                // Prefer audio formats in this order: .m4a > .mp3
                args = [
                    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=mp3]',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--write-thumbnail',
                    '--no-playlist',
                    '-o', `${q.path}.%(ext)s`,
                    `${q.url}`
                ]
                break
            case 'video':
                args = [
                    '-f', 'bestvideo[height<=?1080]+bestaudio',
                    '--merge-output-format', 'mkv',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--write-thumbnail',
                    '--no-playlist',
                    '-o', `${q.path}.mkv`,
                    `${q.url}`
                ]
                break
        }

        // Remove the write thumbnail argument if its query string value is set to false
        if (q.writeThumbnail == 'false') {
            const index = args.indexOf('--write-thumbnail')
            args.splice(index, 1)
        }

        log({app: 'api', event: 'info', msg: 'youtube-dl args: ' + JSON.stringify(args)})
        
        youtubeDl = spawn('youtube-dl', args)

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
        youtubeDl.stderr.on('data', data => log({app: 'youtube-dl', event: 'stderr', msg: data}))

        // Download is complete when youtube-dl closes
        youtubeDl.on('close', async (exitCode) => {
            log({app: 'youtube-dl', event: 'close', msg: exitCode})

            // Expected possible file extensions for downloads
            q.extExpect = {
                video: ['.mkv'],
                audio: ['.m4a', '.mp3'],
                thumbnail: ['.jpg', '.webp']
            }

            // List of the download's file extensions
            q.extFound = {video: '', audio: '', thumbnail: ''}

            // Find which file extensions the media was downloaded as. For video, audio, and thumbnail images.
            await Promise.all(q.extExpect.video.map(el => 
                fsPromises.access(`${q.path}${el}`).then(() => q.extFound.video = el).catch(e => {})
            ))
            await Promise.all(q.extExpect.audio.map(el => 
                fsPromises.access(`${q.path}${el}`).then(() => q.extFound.audio = el).catch(e => {})
            ))
            await Promise.all(q.extExpect.thumbnail.map(el => 
                fsPromises.access(`${q.path}${el}`).then(() => q.extFound.thumbnail = el).catch(e => {})
            ))

            log({app: 'api', event: 'info', msg: 'File extensions of download: ' + JSON.stringify(q.extFound)})

            //
            // Post processing
            //

            // If the thumbnail was downloaded as .webp, convert it to .jpg using ImageMagick's convert command
            if (q.extFound.thumbnail == '.webp') {
                await new Promise((resolve, reject) => {
                    const convert = spawn('convert', [`${q.path}.webp`, `${q.path}.jpg`])
                    
                    log({app: 'convert', event: 'info', msg: 'Converting thumbnail from .webp to .jpg'})
                    
                    convert.on('close', exitCode => {
                        log({app: 'convert', event: 'close', msg: exitCode})
                        
                        // Delete the old .webp file
                        fs.unlink(`${q.path}.webp`, error => error ? log({app: 'unlink', event: 'stderr', msg: error}) : null)
                        
                        // Update the found file extensions to reflect the new thumbnail extension
                        q.extFound.thumbnail = '.jpg'

                        resolve()
                    })
                }).catch(e => console.error(e))
            }
            
            // Add metadata if audio file then emit, otherwise just emit.
            switch (q.format) {
                case 'audio':
                    await new Promise((resolve, reject) => {
                        const ffmpeg = spawn('ffmpeg', [
                            '-i', `${q.path}${q.extFound.audio}`, '-y',
                            '-codec', 'copy',
                            '-metadata', `artist=${q.tags.artist}`,
                            '-metadata', `title=${q.tags.title}`,
                            '-metadata', `genre=${q.tags.genre}`,
                            '-metadata', `album=${q.tags.album}`,
                            '-metadata', `track=${q.tags.track}`,
                            `${q.path}-tmp${q.extFound.audio}`
                        ])
                        
                        log({app: 'ffmpeg', event: 'info', msg: `Adding metadata to "${q.path}-tmp${q.extFound.audio}"`})
                        
                        // Log stderr if exists
                        // ffmpeg.stderr.setEncoding('utf-8')
                        // ffmpeg.stderr.on('data', data => log({app: 'ffmpeg', event: 'stderr', msg: data}))

                        ffmpeg.on('close', exitCode => {
                            log({app: 'ffmpeg', event: 'close', msg: exitCode})
                            resolve()
                        })

                    }).catch(e => console.error(e))

                    // Replace original file with temporary file from ffmpeg which has the metadata embedded
                    await new Promise((resolve, reject) => {
                        const mv = spawn('mv', [`${q.path}-tmp${q.extFound.audio}`, `${q.path}${q.extFound.audio}`])

                        log({app: 'mv', event: 'info', msg: `"${q.path}-tmp${q.extFound.audio}" "${q.path}${q.extFound.audio}"`})

                        // Log stderr if exists
                        mv.stderr.setEncoding('utf-8')
                        mv.stderr.on('data', data => log({app: 'mv', event: 'stderr', msg: data}))

                        mv.on('close', exitCode => {
                            log({app: 'mv', event: 'close', msg: exitCode})
                            resolve()
                        })
                    }).catch(e => console.error(e))

                    // Embed the thumbnail if it was downloaded.
                    // "REMOVE_ALL" keyword exists for --artwork argument to delete all embedded cover art.
                    if (q.writeThumbnail == 'true') {
                        await new Promise((resolve, reject) => {
                            const atomicparsley = spawn('AtomicParsley', [
                                `${q.path}${q.extFound.audio}`,
                                '--overWrite',
                                '--artwork', `${q.path}${q.extFound.thumbnail}`
                            ])
    
                            log({app: 'AtomicParsley', event: 'info', msg: `Embedding thumbnail in "${q.path}${q.extFound.audio}"`})
    
                            // Log stderr if exists
                            atomicparsley.stderr.setEncoding('utf-8')
                            atomicparsley.stderr.on('data', data => log({app: 'AtomicParsley', event: 'stderr', msg: data}))
    
                            atomicparsley.on('close', exitCode => {
                                log({app: 'AtomicParsley', event: 'close', msg: exitCode})

                                // Delete the .jpg file now that it's embedded
                                fs.unlink(`${q.path}.jpg`, error => error ? log({app: 'unlink', event: 'stderr', msg: error}) : null)

                                resolve()
                            })
                        }).catch(e => console.error(e))
                    }

                    // Set permissions if configured
                    setPermissions(q, [`${q.path}${q.extFound.audio}`])

                    // Emit download complete message in the terminal preview
                    io.to(q.socketId).emit('console_stdout', 'Download complete')

                    // Tell client that download is complete. Emit cache path if downloading to browser.
                    if (q.htmlDownload) {
                        io.to(q.socketId).emit('download_complete', `${q.fileName}${q.extFound.audio}`)
                    } else {
                        io.to(q.socketId).emit('download_complete', 'Download complete')
                    }
                    break
                case 'video':
                    var paths = []

                    // Don't include path to thumbnail image if write thumbnail is disabled
                    if (q.writeThumbnail == 'false') {
                        paths = [`${q.path}${q.extFound.video}`]
                    } else {
                        paths = [`${q.path}${q.extFound.video}`, `${q.path}${q.extFound.thumbnail}`]
                    }
                    
                    // Set permissions if configured.
                    setPermissions(q, paths)

                    // Emit download complete message in the terminal preview
                    io.to(q.socketId).emit('console_stdout', 'Download complete')
                    
                    // Tell client that download is complete. Emit cache path if downloading to browser.
                    if (q.htmlDownload) {
                        io.to(q.socketId).emit('download_complete',  `${q.fileName}${q.extFound.video}`)
                    } else {
                        io.to(q.socketId).emit('download_complete', 'Download complete')
                    }
                    break
            }
        })
    } else {
        res.status(400).send('Bad Request')
    }
}

// Download playlist
exports.downloadPlaylist = (req, res) => {
    // Query string: {
    //     url: '', format: '', path: '', 
    //     playlistName: '', outputTemplate: '', socketId: '',
    //     embedThumbnail: 'true' or 'false',
    //     writeThumbnail: 'true' or 'false',
    //     uid: '', gid: '', chmod: ''
    // }

    // Client sends Socket.io id so server can emit events to private room (Each socket automatically joins a room identified by its id).
    
    var q = req.query
    log({app: 'api', event: 'download', msg: JSON.stringify(q)})

    // Format and validate path
    q.path = checkPath('/media/' + q.path + '/')

    // Ensure minimum required query strings have values
    if (q.url && (q.format == 'audio' || q.format == 'video') && q.playlistName && q.outputTemplate && q.socketId) {
        res.status(200).send('OK')

        var youtubeDl, args

        switch (q.format) {
            case 'audio':
                // Prefer audio formats in this order: .m4a > .mp3 > other
                args = [
                    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--embed-thumbnail',
                    '-o', `${q.path}${q.outputTemplate}`,
                    `${q.url}`
                ]

                // Remove the embed thumbnail argument if its query string value is set to false
                if (q.embedThumbnail == 'false') {
                    const index = args.indexOf('--embed-thumbnail')
                    args.splice(index, 1)
                }

                log({app: 'api', event: 'youtube-dl_args', msg: JSON.stringify(args)})
                youtubeDl = spawn('youtube-dl', args)
                break
            case 'video':
                args = [
                    '-f', 'bestvideo[height<=?1080]+bestaudio',
                    '--merge-output-format', 'mkv',
                    '--cookies', '/etc/youtube-dl/cookies',
                    '--ignore-errors',
                    '--write-thumbnail',
                    '-o', `${q.path}${q.outputTemplate}`,
                    `${q.url}`
                ]

                // Remove the write thumbnail argument if its query string value is set to false
                if (q.writeThumbnail == 'false') {
                    const index = args.indexOf('--write-thumbnail')
                    args.splice(index, 1)
                }

                log({app: 'api', event: 'youtube-dl_args', msg: JSON.stringify(args)})
                youtubeDl = spawn('youtube-dl', args)
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
        youtubeDl.stderr.on('data', data => log({app: 'youtube-dl', event: 'stderr', msg: data}))

        youtubeDl.on('close', exitCode => {
            log({app: 'youtube-dl', event: 'close', msg: exitCode})

            // Set permissions if configured
            setPermissions(q, [q.path])

            // Emit download complete message in the terminal preview
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
    
    // Log stderr if exists
    youtubeDl.stdout.setEncoding('utf-8')
    youtubeDl.stderr.on('data', data => log({app: 'youtube-dl', event: 'stderr', msg: data}))

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