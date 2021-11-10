FROM mcr.microsoft.com/azure-functions/node:3.0

# Install ffmpeg and curl
RUN apt-get update
RUN apt-get -y install curl
RUN apt-get -y install ffmpeg

# Setting environment variables of Azure functions
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true
    
COPY . /home/site/wwwroot
RUN cd /home/site/wwwroot && \
    npm install