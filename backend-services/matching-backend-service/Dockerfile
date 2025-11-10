# Build stage
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the freshly built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 5274

CMD ["java", "-jar", "app.jar"]
