![](public/screenshot.png)
# Web app front-end for [youtube-dl][ydl] 
I created this web app because i wanted a faster and easier way to interact with youtube-dl. This app simply runs a youtube-dl command and places the downloaded file at the specified directory in the container. It doesn't download to the web browser or play any media.

## Tech
Client-side: [Mithril.js][m], [Bulma][bu], [Font Awesome][fa]

Server-side: [Docker][d], [Node.js][n], [Express.js][e]

Dev: [Babel][ba], [Webpack][w]

## Media
The intended use case is to mount a media library folder as a volume at `/mnt/ydl/` in the Docker container, as shown in the `docker-compose.yml`. All **folders** within `/mnt/ydl/` will then be visible in the directory browser. youtube-dl will download directly to the specified directory. The file can then be read and streamed by your favorite media server solution.

## Directory browser
The root directory visible in the app is based on the `path` variable in `app.js`, which is set to `/mnt/ydl/` inside the Docker container. 

## Install
Clone the repository then navigate into the directory and run docker-compose. Verify that the volume source path in `docker-compose.yml` is correct for your environment.
```sh
docker-compose up -d
```

## Updating [youtube-dl][ydl] 
youtube-dl tends to need frequent updates to remain functional as websites regularly change and update. To update the youtube-dl version in this app, rebuild it and the latest version will be fetched.

Note: The `--build-arg Y=$RANDOM` used here is to create a change in the dockerfile right before the youtube-dl download layer so that it will never run from cache, while everything preceding it will use image layer caches. This is done to avoid rebuilding the heavy apt packages.

```sh
docker-compose build --build-arg Y=$RANDOM node.js && docker-compose up -d
```

**or**

if you don't want to rebuild, you can jump into the container and grab the updated youtube-dl binary manually
```sh
docker exec -it {container_name} bash
```
```sh
curl -L https://yt-dl.org/downloads/latest/youtube-dl > /usr/local/bin/youtube-dl && chmod +xr /usr/local/bin/youtube-dl
```

[ydl]: https://github.com/ytdl-org/youtube-dl
[m]: https://mithril.js.org/
[bu]: https://bulma.io/
[d]: https://www.docker.com/
[n]: https://nodejs.org/
[e]: https://expressjs.com/
[fa]: https://fontawesome.com/
[ba]: https://babeljs.io/
[w]: https://webpack.js.org/