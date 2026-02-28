FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
RUN apk add --no-cache dos2unix

# Copy gradle wrapper and build config first (cached unless build files change)
COPY gradle ./gradle
COPY gradlew build.gradle settings.gradle ./
RUN dos2unix gradlew && chmod +x gradlew

# Download dependencies (separate cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source and build
COPY src ./src
RUN ./gradlew build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
