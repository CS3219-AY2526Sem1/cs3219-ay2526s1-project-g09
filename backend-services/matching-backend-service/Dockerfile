FROM openjdk:17-jdk-alpine

WORKDIR /app

COPY ./target/matching-service-0.0.1-SNAPSHOT.jar /app

EXPOSE 5274

CMD ["java", "-jar", "matching-service-0.0.1-SNAPSHOT.jar"]