# Stage 1: Build Frontend React UI
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY src/zenomock.docs/package*.json ./
RUN npm install
COPY src/zenomock.docs/ .
RUN npm run build

# Stage 2: Build Backend .NET 10 API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-builder
WORKDIR /src
COPY src/ZenoMock.Api/ .
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Final Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=backend-builder /app/publish .
# Copy kết quả build React vào wwwroot của .NET
COPY --from=frontend-builder /app/dist ./wwwroot

ENTRYPOINT ["dotnet", "ZenoMock.Api.dll"]