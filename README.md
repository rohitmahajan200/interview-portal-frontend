<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# create readme.md file for my frontend need detail file for entire project

Based on the comprehensive frontend file structure analysis, I'll create a detailed README.md file for your React TypeScript interview portal frontend application:

```markdown
# Interview Portal Frontend

A comprehensive React-TypeScript interview management system for candidates and organization users (HR, Managers, Invigilators, Admins) built with modern web technologies.

## 🚀 Overview

This is a full-featured interview portal frontend that provides:
- **Multi-role support**: Candidates, HR, Managers, Invigilators, and Admins
- **Secure assessments** with Safe Exam Browser (SEB) integration
- **Real-time proctoring** with webcam and microphone monitoring
- **Document management** for candidate verification
- **Interview scheduling and management**
- **Glory grading system** for candidate evaluation
- **Push notifications** for real-time updates
- **Responsive design** with dark mode support

## 🛠️ Tech Stack

### Core Technologies
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **React Router DOM** for client-side routing
- **Redux Toolkit** for state management
- **React Hook Form** with Zod validation

### UI & Styling
- **Tailwind CSS** for utility-first styling
- **ShadCN/UI** component library
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Framer Motion** for animations

### Specialized Features
- **TensorFlow.js** for AI-powered proctoring
- **React Webcam** for camera access
- **Face Landmarks Detection** for gaze tracking
- **COCO-SSD** for object detection
- **WebRTC** for real-time communication
- **Service Workers** for push notifications

## 📦 Installation

1. **Clone the repository**
```

git clone <repository-url>
cd interview-portal-frontend

```

2. **Install dependencies**
```

npm install

# or

yarn install

# or

pnpm install

```

3. **Environment setup**
Create a `.env` file in the root directory:
```

VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:3000
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

```

4. **Start development server**
```

npm run dev

# or

yarn dev

# or

pnpm dev

```

## 🏗️ Project Structure

```

src/
├── app/                    \# Redux store configuration
├── components/             \# Reusable UI components
│   ├── ui/                \# ShadCN/UI base components
│   ├── AssessmentInterface.tsx
│   ├── CandidateMultiselect.tsx
│   ├── DocumentCRUD.tsx
│   ├── GloryDialog.tsx
│   ├── ProctorGhost.tsx   \# AI proctoring component
│   └── ...
├── features/              \# Redux slices by domain
│   ├── Candidate/
│   │   ├── auth/          \# Authentication slice
│   │   ├── view/          \# View management
│   │   └── notifications/ \# Notification handling
│   └── Org/
│       ├── Auth/          \# Organization auth
│       ├── HR/            \# HR-specific features
│       └── View/          \# Admin view switching
├── hooks/                 \# Custom React hooks
│   ├── useAuth.ts
│   ├── useGlory.ts
│   ├── useMicVAD.ts      \# Voice activity detection
│   └── ...
├── lib/                   \# Utilities and configurations
│   ├── api.ts             \# Axios configuration
│   ├── proctorStore.ts    \# Proctoring data storage
│   ├── sebHashes.ts       \# Safe Exam Browser integration
│   └── utils.ts           \# General utilities
├── pages/                 \# Route components
│   ├── Dashboard.tsx      \# Main candidate dashboard
│   ├── OrgDashboard.tsx   \# Organization dashboard
│   ├── SecureAssessmentLanding.tsx
│   └── ...
├── services/              \# External service integrations
│   └── pushNotificationService.ts
├── types/                 \# TypeScript type definitions
└── main.tsx              \# Application entry point

```

## 🎯 Key Features

### For Candidates
- **Registration & Authentication** with email verification and OTP
- **Profile Management** with document upload and verification
- **Assessment Taking** with secure browser integration
- **Interview Participation** with video conferencing
- **Real-time Notifications** for updates and reminders
- **Progress Tracking** throughout the hiring process

### For Organizations
- **Multi-role Dashboard** (HR, Manager, Invigilator, Admin)
- **Candidate Management** with detailed profiles and filtering
- **Assessment Creation** with multiple question types
- **Interview Scheduling** with calendar integration
- **Glory Grading System** for comprehensive evaluation
- **Document Verification** workflow
- **Bulk Operations** for efficiency

### Security & Proctoring
- **Safe Exam Browser** integration for secure assessments
- **AI-powered Proctoring** with:
  - Face detection and tracking
  - Gaze direction monitoring
  - Multiple face detection
  - Forbidden object detection
  - Voice activity detection
- **Secure API Communication** with JWT tokens
- **Session Management** with automatic logout

## 🔧 Configuration

### API Configuration
The app uses Axios for API communication configured in `src/lib/api.ts`:
- Automatic token refresh
- Request/response interceptors
- Error handling
- Base URL configuration

### State Management
Redux Toolkit configuration in `src/app/store.ts`:
- Authentication state
- User preferences
- Notifications
- View management
- Admin role switching

### Routing
React Router setup in `src/App.tsx`:
- Protected routes for authenticated users
- Role-based access control
- Error boundaries
- Lazy loading for performance

## 🚀 Available Scripts

```


# Development

npm run dev          \# Start development server
npm run build        \# Build for production
npm run preview      \# Preview production build
npm run lint         \# Run ESLint
npm run type-check   \# TypeScript type checking

```

## 🎨 UI Components

The application uses ShadCN/UI components with custom styling:
- **Consistent Design System** with Tailwind CSS
- **Dark Mode Support** with theme switching
- **Responsive Design** for mobile and desktop
- **Accessible Components** following WCAG guidelines
- **Custom Components** for domain-specific features

## 🔐 Authentication Flow

1. **Candidate Registration**: Email verification required
2. **Login**: Email/password or OTP-based authentication
3. **Organization Login**: Role-based access (HR, Manager, etc.)
4. **Token Management**: Automatic refresh and secure storage
5. **Protected Routes**: Role-based route protection

## 📱 Real-time Features

- **Push Notifications**: Browser notifications for important updates
- **Live Updates**: Real-time status changes and notifications
- **WebRTC Integration**: For video interviews and communication
- **Service Worker**: For offline capability and background sync

## 🤖 AI & Proctoring

The application includes sophisticated AI-powered proctoring:
- **Computer Vision**: Face detection and gaze tracking
- **Object Detection**: Identifying prohibited items
- **Audio Analysis**: Voice activity detection
- **Behavioral Analysis**: Suspicious activity monitoring
- **Real-time Alerts**: Immediate notifications for violations

## 🔧 Deployment

### Build for Production
```

npm run build

```

### Environment Variables
Set up production environment variables:
- `VITE_API_URL`: Production API endpoint
- `VITE_FRONTEND_URL`: Production frontend URL
- `VITE_VAPID_PUBLIC_KEY`: Push notification VAPID key

### Deployment Options
- **Vercel/Netlify**: Direct deployment from repository
- **Docker**: Containerized deployment
- **Static Hosting**: Build output can be served statically
- **CDN Integration**: For optimal performance

## 🧪 Testing

The application supports multiple testing strategies:
- **Unit Tests**: Component and utility testing
- **Integration Tests**: Feature flow testing
- **E2E Tests**: Full user journey testing
- **Visual Testing**: UI consistency checks

## 📚 Documentation

### Type Safety
- Comprehensive TypeScript definitions
- Strict type checking enabled
- Interface definitions for all data models
- Generic components for reusability

### Code Organization
- Feature-based folder structure
- Separation of concerns
- Custom hooks for reusable logic
- Utility functions for common operations

## 🤝 Contributing

1. Follow the established folder structure
2. Use TypeScript for all new components
3. Follow the existing naming conventions
4. Add proper error handling and loading states
5. Ensure responsive design compatibility
6. Test thoroughly before submitting PRs

## 📄 License

[Specify your license here]

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create detailed bug reports
- Follow the contribution guidelines

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
```

This README provides a comprehensive overview of your frontend application, covering all the major features, technologies, and architectural decisions evident from the codebase. It serves as both documentation for developers and a guide for deployment and maintenance.
<span style="display:none">[^1]</span>

<div align="center">⁂</div>

[^1]: feMD.txt

