FROM ubuntu:18.04
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=EST5EDT
RUN ln -sf /usr/share/zoneinfo/EST5EDT /etc/localtime

# Node.js version to use
ENV NODE_VER='v12.10.0'

# Download prerequisites
RUN apt update && \
    apt install -y \
        curl \
        xz-utils \
        python \
        ffmpeg \
        atomicparsley

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

# Download latest youtube-dl version
RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl > /usr/local/bin/youtube-dl && \
    chmod +xr /usr/local/bin/youtube-dl

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

# Run foreground process
CMD node app.js