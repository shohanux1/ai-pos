# AI POS System

A modern Point of Sale (POS) system built with Next.js 14, TypeScript, and Vercel's design system.

## Features

- 🔐 **Authentication System** - Secure login with JWT tokens
- 👥 **User Management** - Admin can manage cashiers and staff
- 📊 **Dashboard** - Real-time sales statistics and metrics
- 🎨 **Vercel Design System** - Clean, minimalist UI with Geist font
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🖥️ **Desktop App** - Tauri integration for native desktop experience
- 🗄️ **Database** - SQLite with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS v4, Vercel Design System
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Database**: SQLite + Prisma
- **Desktop**: Tauri
- **Authentication**: JWT tokens

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shohanux1/ai-pos.git
cd ai-pos
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Credentials

Admin account:
- **Username**: admin
- **Password**: admin123

Cashier account:
- **Username**: cashier
- **Password**: cashier123

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── dashboard/       # Dashboard page
│   ├── login/          # Login page
│   ├── users/          # User management
│   └── globals.css     # Global styles
├── components/          # React components
├── lib/                # Utilities and APIs
│   ├── api/           # API clients
│   └── stores/        # Zustand stores
├── prisma/            # Database schema
├── public/            # Static assets
└── src-tauri/         # Tauri desktop app
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run tauri dev` - Run desktop app in development
- `npm run tauri build` - Build desktop app

## Features Overview

### Authentication
- JWT-based authentication
- Protected routes with middleware
- Persistent login state

### User Management
- Create, read, update, delete users
- Role-based access (Admin/Cashier)
- Password reset functionality

### Dashboard
- Sales statistics
- Transaction counts
- Inventory status
- Low stock alerts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Vercel Design System](https://vercel.com/design)
- Icons from [Lucide](https://lucide.dev/)
