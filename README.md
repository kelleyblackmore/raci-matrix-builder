# RACI Matrix Builder

A modern, AI-powered RACI matrix builder that helps teams define roles and responsibilities with intelligent suggestions. Built with React, TypeScript, and GitHub Spark.

## Features

### 🎯 Core Functionality
- **Role Management**: Add, edit, and remove roles (team members or positions)
- **Task Management**: Define and organize tasks and deliverables
- **Interactive Matrix**: Click cells to cycle through RACI values (R → A → C → I → Empty)
- **Persistent Storage**: All data automatically saved to key-value storage
- **CSV Export**: Export your completed matrix for sharing and documentation

### 🤖 AI-Powered Intelligence
- **Smart Suggestions**: Get AI-recommended RACI assignments for any role-task combination
- **Context-Aware**: Recommendations based on business best practices and role-task relationships
- **One-Click Application**: Instantly apply AI suggestions to your matrix

### 🎨 Professional Design
- Modern, clean interface with professional color-coding
- Responsive design that works on all screen sizes
- Visual RACI legend for quick reference
- Intuitive interactions with hover states and tooltips

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- GitHub Spark enabled (for AI features)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

```bash
# Run development server with hot reload
npm run dev

# Lint the codebase
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

Run the application in a Docker container:

```bash
# Build the Docker image
docker build -t raci-matrix-builder .

# Run the container
docker run -d -p 8080:80 --name raci-matrix raci-matrix-builder

# Access the application at http://localhost:8080
```

Stop and remove the container:

```bash
# Stop the container
docker stop raci-matrix

# Remove the container
docker rm raci-matrix
```

Using Docker Compose (create a `docker-compose.yml` file):

```yaml
version: '3.8'
services:
  raci-matrix:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

## How to Use

1. **Add Roles**: Enter role names (e.g., "Project Manager", "Developer", "Designer") in the role input
2. **Add Tasks**: Define tasks that need RACI assignments (e.g., "Code Review", "Documentation")
3. **Assign Values**: Click matrix cells to cycle through RACI values
4. **Use AI Suggestions**: Click the sparkle icon in any cell for an AI recommendation
5. **Export**: Download your completed matrix as a CSV file

## RACI Definitions

- **R (Responsible)**: Does the work to complete the task
- **A (Accountable)**: Ultimately answerable and has final authority
- **C (Consulted)**: Provides input and expertise (two-way communication)
- **I (Informed)**: Kept up-to-date on progress (one-way communication)

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS
- **AI Integration**: GitHub Spark LLM API
- **State Management**: React hooks with KV storage
- **Icons**: Phosphor Icons

## Project Structure

```
src/
├── App.tsx              # Main application component
├── components/ui/       # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── styles/             # Global styles and theme
```

## License

MIT License - Copyright GitHub, Inc.

See [LICENSE](LICENSE) for more information.
