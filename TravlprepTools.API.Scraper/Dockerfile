FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["TravlprepTools.API.Scraper.csproj", "./"]
RUN dotnet restore "TravlprepTools.API.Scraper.csproj"
COPY . .
RUN dotnet build "TravlprepTools.API.Scraper.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TravlprepTools.API.Scraper.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create the downloaded_images directory
RUN mkdir -p /app/downloaded_images

# Install dependencies for Puppeteer (Chrome/Chromium)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable to disable HTTPS redirection (Railway provides its own HTTPS)
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "TravlprepTools.API.Scraper.dll"]

