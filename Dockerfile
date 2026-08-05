# Multi-stage: React playground → .NET 10 publish → single runtime image (Mode 1).
# Pages builds use VITE_BASE=/zenomock/; this image must use VITE_BASE=/.

# Stage 1: Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY src/zenomock.docs/package*.json ./
RUN npm ci
COPY src/zenomock.docs/ .
ENV VITE_BASE=/
RUN npm run build

# Stage 2: Backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-builder
WORKDIR /src
COPY src/ZenoMock.Api/ZenoMock.Api.csproj src/ZenoMock.Api/
RUN dotnet restore src/ZenoMock.Api/ZenoMock.Api.csproj
COPY src/ZenoMock.Api/ src/ZenoMock.Api/
RUN dotnet publish src/ZenoMock.Api/ZenoMock.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    --no-self-contained

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

LABEL org.opencontainers.image.source="https://github.com/goldhoang/zenomock" \
      org.opencontainers.image.title="zenomock" \
      org.opencontainers.image.description="ZenoMock — Zero Network Mock Engine (.NET 10 + React)"

COPY --from=backend-builder /app/publish .
COPY --from=frontend-builder /app/dist ./wwwroot

ENTRYPOINT ["dotnet", "ZenoMock.Api.dll"]
