# Cryptocurrency Portfolio Tracker

A robust cryptocurrency portfolio management application that enables real-time tracking of crypto investments across multiple wallets and exchanges. Built with NestJS and React.

## Features

- **User Authentication & Security**
  - Secure user registration and login
  - JWT-based authentication
  - Role-based access control (RBAC) with admin/user roles
  - 2FA support

- **Portfolio Management**
  - Add and manage multiple wallets and exchanges
  - Real-time cryptocurrency price tracking
  - Portfolio diversification analysis
  - Transaction history
  - Custom watchlists

- **Data Visualization**
  - Interactive price charts using Chart.js
  - Portfolio performance metrics
  - Asset allocation breakdown
  - Profit/Loss tracking
  - Historical performance analysis

- **Data Integration**
  - Real-time market data from multiple crypto APIs
  - CSV import/export functionality
  - Exchange API integration
  - Automated balance updates

## Role-Based Access Control (RBAC)

- Users have one or more roles (e.g., 'user', 'admin').
- Roles are stored in the database and included in JWT tokens.
- Endpoints can be restricted to specific roles using the @Roles decorator.
- Admins can update user roles via the `/auth/admin/update-roles` endpoint:

  - **POST /auth/admin/update-roles**
    - Body: `{ "userId": "<userId>", "roles": ["user", "admin"] }`
    - Requires: Admin role
    - Description: Updates the roles for a user.

## Technologies Used

### Backend
- NestJS
- TypeScript
- MongoDB with Mongoose
- Redis for caching
- BullMQ for job processing
- JWT for authentication

### Frontend
- ReactJS
- Material UI
- Chart.js
- Axios

### DevOps & Tools
- Docker
- Docker Compose
- ESLint
- Prettier
- Jest for testing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn
- Docker (optional)

### Installation

1. Clone the repository


