# Micro Frontend Setup - PeerPrep

## What We've Built

**Container App** - Main PeerPrep app  
- **Location**: `ui-shell/`  
- **Port**: 5173  

**Matching Micro Frontend**  
- **Location**: `ui-services/matching-ui-service/`  
- **Port**: 5174  

**Questions Micro Frontend**  
- **Location**: `ui-services/questions-ui-service/`  
- **Port**: 5175  

**Collaboration Micro Frontend**  
- **Location**: `ui-services/collab-ui-service/`  
- **Port**: 5176  

**User Micro Frontend**  
- **Location**: `ui-services/user-ui-service/`  
- **Port**: 5177  

**History Micro Frontend**  
- **Location**: `ui-services/history-ui-service/`  
- **Port**: 5178

---

## How It Works

This setup uses **Micro Frontends (MFEs)** where each service (Matching, Questions, Collaboration, User) runs as a standalone Vite app, built and served separately.  

The **Container App (ui-shell)** acts as the main entry point and dynamically loads these MFEs at runtime.  
Each MFE is hosted on its own port and exposed via Module Federation, which allows the shell to import and render them seamlessly.

---

## Running the Apps

### 1. Running Locally (without Docker)
Each app uses Vite. Navigate into the app directory and run:

```bash
npm install

#For shell
npm run dev 

#For MFE
npm run build && npm run preview -- --port <port_number> --strictPort 
```

By default, the ports are:
- Shell: http://localhost:5173
- Matching: http://localhost:5174
- Questions: http://localhost:5175
- Collaboration: http://localhost:5176
- User: http://localhost:5177
- History: http://localhost:5178
---
### 2. Running with Docker Compose (Recommended)
This approach simplifies the process by managing all services with a single command. It uses the `docker-compose.yml` file provided to build and run all services together.
- Ensure you have Docker and Docker Compose installed.
- Navigate to the root directory where the docker-compose.yml file is located.
- Run the following command to build and start all services in detached mode:
```bash
docker-compose up --build -d
```

This command will build the Docker images for each service and start all containers, exposing them on the specified ports.
---
## Testing the Setup
1. Start all MFEs and the shell (either locally with npm run dev or via Docker).
2. Open the shell in your browser: http://localhost:5173
3. The shell will load the MFEs dynamically.
4. Interact with the UI — if the MFEs load correctly, the setup is working!