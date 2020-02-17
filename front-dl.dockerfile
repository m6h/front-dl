FROM ubuntu:18.04
ENV DEBIAN_FRONTEND=noninteractive

# Set timezone. Default to US/Eastern
ARG TZ=US/Eastern
ENV TZ=$TZ
RUN apt update && apt install -y tzdata && \
    ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Download prerequisites
RUN apt install -y \
        curl \
        xz-utils \
        python \
        ffmpeg \
        atomicparsley

# Node.js version to use
ENV NODE_VER='v12.14.1'

# Download Node.js
RUN mkdir -p /media/dl/ && \
    mkdir -p /node/ && \
    curl -L https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-linux-x64.tar.xz > /media/dl/node-$NODE_VER-linux-x64.tar.xz && \
    tar -xf /media/dl/node-$NODE_VER-linux-x64.tar.xz --directory /media/dl/ && \
    cd "/media/dl/node-$NODE_VER-linux-x64/" && \
    cp -r ./bin/* /usr/bin/ && \
    cp -r ./include/* /usr/include/ && \
    cp -r ./lib/* /usr/lib/ && \
    cp -r ./share/* /usr/share/ && \
    rm -r /media/dl/

WORKDIR /node/

# Copy app files to /node/
COPY ["./controllers/", "/node/controllers/"]
COPY ["./models/", "/node/models/"]
COPY ["./public/", "/node/public/"]
COPY ["./src/", "/node/src/"]
COPY [".babelrc", "app.js", "LICENSE", "package.json", "package-lock.json", "README.md", "/node/"]

EXPOSE 3000

# npm dependencies and make
RUN npm install && \
    npm run bundle-prod

# Download latest youtube-dl version
RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl > /usr/local/bin/youtube-dl && \
    chmod +xr /usr/local/bin/youtube-dl

# Run foreground process
CMD ["node", "app.js"]