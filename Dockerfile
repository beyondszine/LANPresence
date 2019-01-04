
FROM node

LABEL maintainer="saurabh shandilya <saurabhshandilya.1991@gmail.com>"

# Pass your environment variables

##########################################
# DO NOT EDIT THIS ----->
##########################################
ENV APP_PORT 4000
ENV PORT ${APP_PORT}

# Expose ports
EXPOSE ${APP_PORT}

# Add source code
WORKDIR /app
COPY . /app

# Make scripts executable
RUN chmod +x *.sh
RUN apt-get update && apt-get -y install arp-scan

RUN npm install --prod

# RUN groupadd -r nodejs && useradd -m -r -g nodejs nodejs
# USER nodejs

##########################################
# ------> DO NOT EDIT THIS
##########################################

# Add Tini
# ENV TINI_VERSION v0.18.0
# ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
# RUN chmod +x /tini
# ENTRYPOINT ["/tini", "-g", "--", "/usr/bin/node","app.js"]
CMD ["node","app.js"]

# Run the start script, it will check for an /app/prestart.sh script (e.g. for migrations)
# And then will start Supervisor, which in turn will start Nginx and uWSGI
# CMD ["/start.sh"]
