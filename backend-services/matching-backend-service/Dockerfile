FROM openjdk:17-jdk-alpine

WORKDIR /app

ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

EXPOSE 5274

CMD ["java", "-jar", "app.jar"]