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
ENV NODE_VER='v12.10.0'

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

# Add app files
ADD ./public/ /node/public/
ADD ./src/ /node/src/
ADD ./app.js /node/
ADD ./package.json /node/
ADD ./LICENSE /node/
ADD ./README.md /node/

WORKDIR /node/

# npm dependencies and make
RUN npm install && \
    npm run make

# Download latest youtube-dl version
ARG Y=
RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl > /usr/local/bin/youtube-dl && \
    chmod +xr /usr/local/bin/youtube-dl

# Run foreground process
CMD node app.js