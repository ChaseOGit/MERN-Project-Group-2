# UCF Technology Lending Platform

![Live Status](https://img.shields.io/badge/Status-Live-success)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![Stack](https://img.shields.io/badge/Stack-MERN-informational)

A full-stack Single Page Application (SPA) designed to overhaul and modernize the legacy hardware lending system at the University of Central Florida. Built by Group 2, this platform manages live inventory, enforces strict Role-Based Access Control (RBAC), and calculates automated late-fines tied to exact-minute chain-of-custody transaction logs.

**Live Demo:** [cis4004chase.xyz](https://cis4004chase.xyz)  
**API Documentation:** [Swagger UI](https://cis4004chase.xyz/api-docs)

---

## Key Features

### Student Experience
* **Secure Authentication:** 1-click Google OAuth 2.0 login alongside a custom JWT/bcrypt local login flow.
* **Smart Catalog:** Progressive disclosure UI with dynamic filtering and "Smart Suggestions" for items available at alternate campus locations.
* **Self-Service Dashboard:** Students can view active rentals, exact due dates, estimated late fines, and receive automated transactional emails via the **Resend API**.

### Circulation Desk (Faculty/Staff)
* **Point-of-Sale UI:** Split-screen interface for fast walk-up checkouts and return inspections.
* **Instant Auto-Fill:** Librarians can click on a student's pending web reservation to instantly prepare an order.
* **Fine Calculation & Condition Logging:** Returns automatically log hardware condition and apply fines for overdue hardware.

### Admin Inventory Management
* **Webcam Barcode Scanning:** Integrated `@zxing/library` allows admins to scan physical UPC barcodes via webcam to instantly identify hardware.
* **Cascading Auto-Fill APIs:** A fault-tolerant data scraper. If an admin types a product name, the system queries the **DummyJSON API**. If not found, it safely falls back to the **Wikipedia OpenSearch & REST APIs** to auto-fill descriptions and images.
* **Bulk Uploading:** Admins can inject multiple serial numbers simultaneously.

---

## Technology Stack

**Frontend:** React, Vite, React Router, Lucide Icons  
**Backend:** Node.js, Express.js, JWT, Bcrypt, Mongoose  
**Database:** MongoDB Atlas  
**APIs:** Google OAuth, Resend, DummyJSON, Wikipedia REST, UPCitemdb  
**DevOps:** DigitalOcean (Ubuntu), Nginx (Gzip, HTTP/2), PM2, Let's Encrypt (SSL)  
**Testing & CI/CD:** Jest, Supertest, GitHub Actions  

---

## Screenshots
<img width="1132" height="918" alt="tech2" src="https://github.com/user-attachments/assets/b5afd269-63d2-443e-b81e-b37afe6ca465" />
<br>
<img width="1120" height="946" alt="tech1" src="https://github.com/user-attachments/assets/8b3476e6-e3df-4c8a-b7bc-c98419d08fab" />
---

## Local Development Setup

If you wish to run this project locally, ensure you have Node.js and Git installed.

**1. Clone the repository**
```bash
git clone https://github.com/ChaseOGit/MERN-Project-Group-2.git
cd MERN-Project-Group-2

2. Install Dependencies

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

3. Configure Environment Variables Create a .env file inside the server folder
with the following keys:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_string
JWT_EXPIRES_IN=7d
EMAIL_VERIFY_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173

# Optional: Google OAuth & Resend API
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/users/oauth/google/callback
RESEND_API_KEY=your_resend_key
EMAIL_FROM=onboarding@resend.dev

4. Run the Application We have configured a concurrent script to run both the
frontend and backend simultaneously.

# From the root directory:
npm run dev

The React frontend will be available at http://localhost:5173.

<img width="1120" height="946" alt="tech1" src="https://github.com/user-attachments/assets/b4047f55-7684-4959-a4d1-3ba162444e77" />
Testing & CI/CD

This project uses Jest and Supertest for automated backend unit testing.

cd server
npm test

We utilize a GitHub Actions CI/CD Pipeline. Upon every push or Pull Request to
the main branch, the pipeline spins up an isolated Ubuntu container, injects
database secrets, and runs the test suite. If any test fails, the deployment to
the live DigitalOcean droplet is safely aborted.

