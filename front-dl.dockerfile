FROM ubuntu:18.04
ENV DEBIAN_FRONTEND=noninteractive

# Set timezone. Default to US/Eastern
ARG TZ=US/Eastern
ENV TZ=$TZ
RUN apt update && apt install -y tzdata && \
    ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    rm -r /var/lib/apt/lists/*

# Download prerequisites, then clear apt cache
RUN apt update && apt install -y \
        curl \
        xz-utils \
        python \
        atomicparsley && \
    rm -r /var/lib/apt/lists/*

# Node.js version to use
ENV NODE_VER='v12.14.1'

# Install Node.js
RUN mkdir -p /srv/nodejs/ && cd /srv/nodejs/ && \
    mkdir -p /node/ && \
    curl -L https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-linux-x64.tar.xz > node-$NODE_VER-linux-x64.tar.xz && \
    tar -xf node-$NODE_VER-linux-x64.tar.xz --strip-components 1 && \
    cp -r ./bin/* /usr/bin/ && \
    cp -r ./include/* /usr/include/ && \
    cp -r ./lib/* /usr/lib/ && \
    cp -r ./share/* /usr/share/ && \
    rm -r /srv/nodejs/

# Install ffmpeg (latest)
RUN mkdir -p /srv/ffmpeg/ && cd /srv/ffmpeg/ && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz > ffmpeg-release-amd64-static.tar.xz && \
    tar -xf ffmpeg-release-amd64-static.tar.xz --strip-components 1 && \
    mv ffmpeg /usr/local/bin/ && \
    mv ffprobe /usr/local/bin/ && \
    rm -r /srv/ffmpeg/

# Install youtube-dl (latest)
RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl > /usr/local/bin/youtube-dl && \
    chmod +xr /usr/local/bin/youtube-dl && \
    mkdir -p /etc/youtube-dl

WORKDIR /node/

# Get npm dependencies
COPY ["package.json", "package-lock.json", "/node/"]
RUN npm install

# Copy app files to /node/
COPY ["./controllers/", "/node/controllers/"]
COPY ["./models/", "/node/models/"]
COPY ["./public/", "/node/public/"]
COPY ["./src/", "/node/src/"]
COPY [".babelrc", "app.js", "LICENSE", "README.md", "/node/"]

EXPOSE 3000

# Bundle
RUN npm run bundle-prod

# Run foreground process
CMD ["node", "app.js"]