# Career Guidance and Employment Integration Platform

A comprehensive web application platform designed to assist high school students in Lesotho discover higher learning institutions, apply for courses, and connect with employment opportunities upon graduation.

## 🎯 Project Overview

This platform serves as a bridge between students, educational institutions, and employers in Lesotho, providing:

- **Course Discovery**: Browse institutions and courses across Lesotho
- **Online Applications**: Apply to higher learning institutions digitally
- **Admission Management**: Streamlined admission process for institutions
- **Career Placement**: Job matching and application system for graduates
- **Transcript Management**: Secure digital transcript storage and sharing

## 🏗️ System Architecture

### Frontend (Client)
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router
- **UI Components**: Custom component library

### Backend (Server)
- **Runtime**: Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + JWT
- **File Storage**: Firebase Storage
- **Email**: Nodemailer with SMTP

### Key Features
- Multi-role authentication (Student, Institution, Company, Admin)
- Course eligibility checking and recommendations
- Intelligent job-student matching algorithm
- Digital transcript verification system
- Real-time notifications
- Comprehensive reporting and analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Firebase project with Firestore enabled
- SMTP email service (Gmail, Outlook, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/career-guidance-platform.git
   cd career-guidance-platform