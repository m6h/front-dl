FROM mongo:4.2.3
ENV DEBIAN_FRONTEND=noninteractive

# Set timezone. Default to US/Eastern
ARG TZ=US/Eastern
ENV TZ=$TZ
RUN apt update && apt install -y tzdata && \
	ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && \
	echo $TZ > /etc/timezone