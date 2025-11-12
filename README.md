[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)

# CS3219 Project (PeerPrep) - AY2526S1

PeerPrep is a technical interview preparation platform designed to help students and professionals practice coding interviews together in a real-time collaborative environment.
The platform leverages a microservices architecture to ensure scalability and maintainability.

Users can find peers to practice with, match based on topic preferences, and collaborate on coding problems in real-time.

Use PeerPrep [here](https://d1h013fkmpx3nu.cloudfront.net).

## Group: G09

Team Members:

- WOO ZONG HUA ([@wzhua02](https://github.com/wzhua02))
- CENSON LEE LEMUEL JOHN ALEJO ([@Ryuse](https://github.com/Ryuse))
- SONG JIA HUI ([@jiahui0309](https://github.com/jiahui0309))
- SHARON SOH XUAN HUI ([@xGladiate](https://github.com/xGladiate))
- YAP ZHAO YI ([@ToxOptimism](https://github.com/ToxOptimism)/[@ToxicOptimism](https://github.com/ToxicOptimism))

---

## Running the PeerPrep application with Docker

**Before running** check for the following requirements:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Hub](https://hub.docker.com/) (for pulling required base images)

> **Note:** Make sure Docker Engine is running before executing any commands.

---

### Environment Configuration

Each **frontend** and **backend** service in PeerPrep requires its own `.env` file for configuration.

You can find sample environment files (`.env.example`) in each corresponding directory.  
Copy each one to a `.env` file and fill in the required values according to your local setup.

#### Frontend Services

Create `.env` files for the following:

```
./ui-shell
./ui-services/collab-ui-service
./ui-services/history-ui-service
./ui-services/matching-ui-service
./ui-services/question-ui-service
./ui-services/user-ui-service
```

#### Backend Services

Create `.env` files for the following:

```
./backend-services/chatting-backend-service
./backend-services/collab-backend-service
./backend-services/history-backend-service
./backend-services/leetcode-backend-service
./backend-services/matching-backend-service
./backend-services/question-backend-service
./backend-services/user-backend-service
```

## Each `.env.example` contains all required keys for that service.

### Running the Application

Once all `.env` files are set up:

1. Navigate to the **root directory** of the project.
2. Run the following command to build and start all containers:

   ```bash
   docker compose up
   ```

This will:

- Build all backend and frontend service containers.
- Start the complete PeerPrep system locally.
- Expose the services as defined in the `docker-compose.yml`.

> The first build may take several minutes as dependencies are downloaded and containers are built.

---

### Verifying Deployment

Once all containers are up and running, you can:

- Access the **UI Shell** (main app) via [http://localhost:5173](http://localhost:5173).
- Check logs for any service with:

  ```bash
  docker compose logs -f <service-name>
  ```

- Verify connectivity between services using the Docker Dashboard or:

  ```bash
  docker ps
  ```

---

## Architecture Diagram

![alt text](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/docs/architecture_diagram.png "Architecture Diagram")

## Ports

| Frontend Service Name       | Port |
| --------------------------- | ---- |
| WebApp                      | 5173 |
| User UI Service             | 5177 |
| Question History UI Service | 5178 |
| Question UI Service         | 5175 |
| Matching UI Service         | 5174 |
| Collaboration UI Service    | 5176 |

| Backend Service Name     | Port |
| ------------------------ | ---- |
| User Service             | 5277 |
| Question History Service | 5278 |
| Question Service         | 5275 |
| LeetCode Service         | 5285 |
| Matching Service         | 5274 |
| Collaboration Service    | 5276 |
| Chat Service             | 5286 |
| Redis Instance           | 6379 |

---

## Backend Services

### **User Service**

Handles **user profile management**, including:

- Account creation and authentication
- Profile updates and settings

For more details about the API:
[User Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/user-backend-service/README.md)

---

### **Matching Service**

Handles **match request management**, including:

- Handling match request creation and cancellation
- Handling match acceptance states

For more details about the API:
[Matching Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/matching-backend-service/README.md)

---

### **Question Service**

Handles **CRUD operations for questions**, including:

- Storing metadata and rich question content such as images
- Retrieving random questions

For more details about the API:
[Question Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/question-backend-service/README.md)

---

### **LeetCode Service**

Handles _sampling questions_ from a Github Repo, including:

- Daily fetching and syncing of new questions

For more details about the API:
[LeetCode Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/leetcode-backend-service/README.md)

---

### **Collaboration Service**

Handles **real-time code collaboration** between matched users, including:

- Concurrent code editing
- Syntax highlighting support
- Session management

For more details about the API:
[Collaboration Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/collab-backend-service/README.md)

---

### **Chat Service**

Handles **real-time communication** between matched users during collaboration, including:

- Text-based chat in session

For more details about the API:
[Chat Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/chatting-backend-service/README.md)

---

### **Question History Service**

Handles the **storage and retrieval of user question history**, including:

- Viewing of previously attempted questions

For more details about the API:
[Question History Service README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g09/blob/master/backend-services/history-backend-service/README.md)

---

## AI Usage

Use of CoPilot for code reviews as seen in the GitHub Repository
