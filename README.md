# CampusCrate 📦

CampusCrate is a student-focused, full-stack marketplace that enables students within the same campus or nearby institutes to securely rent, sell, or donate essential items such as books, electronics, lab tools, and hostel utilities.

![CampusCrate Preview](https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg) *(Replace with actual screenshot later)*

## 🌱 Features
- **Student-Only Access**: Secure signup requiring college email verification via 6-digit OTPs.
- **Item Listings**: Rent, sell, or donate items easily with categorized filters.
- **Image Uploads**: Fast, seamless image uploading powered by Cloudinary.
- **Real-time Messaging**: Built-in real-time WebSocket chat system to securely message sellers without exposing personal phone numbers.
- **Rich Profiles**: User profiles with "Trust Scores" and verified student badges.
- **Dynamic Routing**: Protected routes that prevent unauthorized access to the marketplace.

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS & Lucide React Icons
- **Routing**: React Router DOM
- **Deployment**: Netlify (`https://campuscratenew.netlify.app`)

### Backend (Server)
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: SQLAlchemy & Pydantic
- **Authentication**: JWT Tokens, bcrypt password hashing, and Resend for OTP Emails
- **Real-time**: FastAPI WebSockets
- **Deployment**: Railway

## 🚀 Local Development

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate the virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
*Note: Make sure to set up your `.env` file in the backend directory with your `DATABASE_URL`, `RESEND_API_KEY`, and `CLOUDINARY` credentials.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎓 Purpose
CampusCrate was built to demonstrate usability, sustainability, and social impact for student communities by making it easy to reuse and share resources securely.
