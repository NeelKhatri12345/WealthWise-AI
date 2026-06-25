# WealthWise AI — Frontend Architecture

> **Stack:** React 19 · TypeScript · Vite · TailwindCSS · Zustand · Highcharts · Axios

---

## 1. Folder Structure & Responsibilities

```
frontend/src/
│
├── components/               # Reusable UI components
│   ├── common/               # Generic: Button, Input, Modal, Badge, Spinner, Alert
│   ├── dashboard/            # Dashboard-specific: StatCard, RecentActivity, QuickActions
│   ├── charts/               # Highcharts wrappers: SpendingChart, TrendChart, DonutChart
│   ├── forms/                # Form components: UploadForm, FilterForm, ChatInput
│   └── layouts/              # Layout shells: AuthLayout, DashboardLayout, AdminLayout
│
├── pages/                    # Route-level page components
│   ├── Landing/              # Public landing page (LandingPage.tsx)
│   ├── Auth/                 # Login.tsx, Register.tsx
│   ├── Dashboard/            # Main dashboard (DashboardPage.tsx)
│   ├── Upload/               # Statement upload (UploadPage.tsx)
│   ├── Transactions/         # Transaction list (TransactionsPage.tsx)
│   ├── HealthScore/          # Health score view (HealthScorePage.tsx)
│   ├── RiskProfile/          # Risk assessment (RiskProfilePage.tsx)
│   ├── Portfolio/            # Portfolio view (PortfolioPage.tsx)
│   ├── AICoach/              # Chat interface (AICoachPage.tsx)
│   ├── Reports/              # Analytics reports (ReportsPage.tsx)
│   ├── Profile/              # User profile (ProfilePage.tsx)
│   ├── Settings/             # Settings (SettingsPage.tsx)
│   └── Admin/                # Admin panel (AdminPage.tsx)
│
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Auth state + redirect logic
│   ├── useTransactions.ts    # Transaction fetching + filtering
│   ├── useHealthScore.ts     # Health score data
│   ├── useRiskProfile.ts     # Risk profile data
│   ├── usePortfolio.ts       # Portfolio data
│   ├── useStatements.ts      # Statement list + upload
│   ├── useAICoach.ts         # Chat session management
│   └── usePagination.ts      # Generic pagination hook
│
├── services/                 # Axios API service layer
│   ├── api.ts                # Axios instance + interceptors
│   ├── authService.ts        # login, register, refresh, logout
│   ├── statementService.ts   # upload, list, get, delete, download
│   ├── analyticsService.ts   # transactions, summary, health score, risk
│   └── aiCoachService.ts     # chat, sessions
│
├── store/                    # Zustand global state
│   ├── authStore.ts          # User session, tokens, login/logout actions
│   ├── uiStore.ts            # Theme, sidebar open, global loading, toast notifications
│   └── analyticsStore.ts     # Cached analytics data (health score, risk profile)
│
├── utils/                    # Frontend utilities
│   ├── formatters.ts         # formatCurrency, formatDate, formatPercent
│   ├── chartConfigs.ts       # Shared Highcharts base configurations
│   ├── validators.ts         # Zod schemas for form validation
│   └── constants.ts          # API_BASE_URL, route paths, category colors
│
├── assets/                   # Static assets
│   ├── logo.svg
│   └── icons/
│
├── types/                    # TypeScript interfaces and types
│   ├── auth.types.ts
│   ├── statement.types.ts
│   ├── transaction.types.ts
│   ├── analytics.types.ts
│   └── api.types.ts          # Generic API response types
│
└── App.tsx                   # Root component with router setup
```

---

## 2. Routing Structure

```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Protected routes (wrapped in PrivateRoute) */}
    <Route element={<PrivateRoute />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/health-score" element={<HealthScorePage />} />
        <Route path="/risk-profile" element={<RiskProfilePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/ai-coach" element={<AICoachPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>

    {/* Admin routes (wrapped in AdminRoute) */}
    <Route element={<AdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
</BrowserRouter>
```

### Route Guards
```typescript
// PrivateRoute: Checks authStore.isAuthenticated
//   → Redirect to /login if not authenticated
//   → Render <Outlet /> if authenticated

// AdminRoute: Checks authStore.user.role === 'admin'
//   → Redirect to /dashboard if not admin
//   → Render <Outlet /> if admin
```

---

## 3. State Management (Zustand)

### `authStore.ts`
```typescript
interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  setUser: (user: UserResponse) => void
}
```

**Persistence:** `accessToken` stored in memory only (XSS protection). `refreshToken` stored in `localStorage` (required for page refresh). Token refresh triggered by Axios interceptor on 401.

### `uiStore.ts`
```typescript
interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  globalLoading: boolean
  toasts: Toast[]

  toggleTheme: () => void
  toggleSidebar: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}
```

### `analyticsStore.ts`
```typescript
interface AnalyticsState {
  latestHealthScore: HealthScoreResponse | null
  latestRiskProfile: RiskProfileResponse | null
  recentTransactionSummary: TransactionSummaryResponse | null
  lastFetched: Date | null

  fetchAnalyticsSnapshot: () => Promise<void>
  invalidate: () => void
}
```

---

## 4. API Service Layer

### `api.ts` — Axios Instance
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: Inject access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: Handle 401 → refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().refreshTokens()
      return api.request(error.config)  // Retry original request
    }
    return Promise.reject(error)
  }
)
```

### Service Pattern
```typescript
// analyticsService.ts
export const analyticsService = {
  getTransactions: (params: TransactionFilters) =>
    api.get<PaginatedResponse<TransactionResponse>>('/transactions', { params }),

  getTransactionSummary: (params: DateRange) =>
    api.get<TransactionSummaryResponse>('/transactions/summary', { params }),

  calculateHealthScore: (data: HealthScoreCalculateRequest) =>
    api.post<HealthScoreResponse>('/health-score/calculate', data),

  getLatestHealthScore: () =>
    api.get<HealthScoreResponse>('/health-score/latest'),

  predictRiskProfile: (data: RiskProfilePredictRequest) =>
    api.post<RiskProfileResponse>('/risk-profile/predict', data),
}
```

---

## 5. Highcharts Integration Strategy

### Base Configuration (shared)
```typescript
// utils/chartConfigs.ts
export const baseChartConfig: Highcharts.Options = {
  chart: {
    style: { fontFamily: 'Inter, sans-serif' },
    backgroundColor: 'transparent',
    animation: { duration: 600, easing: 'easeOutQuart' },
  },
  credits: { enabled: false },
  title: { text: undefined },
  colors: ['#6366F1', '#22D3EE', '#10B981', '#F59E0B', '#EF4444'],
  tooltip: {
    backgroundColor: '#1E1E2E',
    borderRadius: 8,
    style: { color: '#fff' },
  },
}
```

### Chart Components
```
charts/
├── SpendingDonutChart.tsx     # Category breakdown (Pie/Donut)
├── MonthlyTrendChart.tsx      # Income vs Expenses (Column + Line)
├── HealthScoreGauge.tsx       # Score gauge (Solid Gauge)
├── TransactionSparkline.tsx   # Mini trend line (Sparkline)
├── PortfolioAllocationChart.tsx  # Allocation (Pie)
└── SavingsRateChart.tsx       # Savings rate over time (Area)
```

### Highcharts Module Loading
```typescript
// main.tsx
import Highcharts from 'highcharts'
import HighchartsMore from 'highcharts/highcharts-more'
import SolidGauge from 'highcharts/modules/solid-gauge'
import Accessibility from 'highcharts/modules/accessibility'
import Exporting from 'highcharts/modules/exporting'

HighchartsMore(Highcharts)
SolidGauge(Highcharts)
Accessibility(Highcharts)
Exporting(Highcharts)
```

---

## 6. Component Architecture Patterns

### Page Structure (every page follows this)
```tsx
// DashboardPage.tsx
const DashboardPage: React.FC = () => {
  // 1. Store access
  const { user } = useAuthStore()
  // 2. Custom hook for data
  const { healthScore, isLoading, error } = useHealthScore()
  // 3. Local UI state
  const [dateRange, setDateRange] = useState<DateRange>(...)

  // 4. Render
  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState error={error} />

  return (
    <PageWrapper title="Dashboard">
      <StatCardGrid />
      <ChartSection />
      <RecentTransactions />
    </PageWrapper>
  )
}
```

### Form Handling (React Hook Form + Zod)
```tsx
// Pattern for all forms
const schema = z.object({ email: z.string().email(), ... })
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

---

## 7. TailwindCSS Design System

### Color Palette
```css
/* Extend in tailwind.config.ts */
colors: {
  brand: {
    50: '#eef2ff',
    500: '#6366f1',   /* Primary */
    600: '#4f46e5',   /* Primary hover */
    900: '#312e81',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#1E1E2E',    /* Dark card bg */
  border: '#2D2D3F',     /* Dark border */
}
```

### Component Classes (consistent patterns)
```css
/* Card */
.card: rounded-2xl bg-surface border border-border p-6 shadow-lg

/* Primary Button */
.btn-primary: px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg
              transition-colors duration-200 font-medium

/* Input */
.input: w-full px-3 py-2 bg-surface border border-border rounded-lg
        text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-500

/* Badge */
.badge: inline-flex px-2 py-1 rounded-full text-xs font-medium
```

---

## 8. Development Order for Frontend

```
Phase 1: Foundation
  1. vite.config.ts — proxy setup, env variables
  2. tailwind.config.ts — design tokens
  3. types/ — all TypeScript interfaces
  4. utils/constants.ts — route paths, API URL
  5. services/api.ts — Axios instance with interceptors

Phase 2: Auth
  6. store/authStore.ts — Zustand auth state
  7. services/authService.ts — login/register/logout
  8. pages/Auth/ — Login, Register pages
  9. components/layouts/AuthLayout.tsx

Phase 3: Core Layout
  10. components/layouts/DashboardLayout.tsx — Sidebar + Topbar
  11. store/uiStore.ts — theme, sidebar
  12. components/common/ — Button, Input, Badge, Modal, Toast

Phase 4: Feature Pages (in dependency order)
  13. Upload page + statement service
  14. Transactions page + analytics service
  15. Health Score page + charts
  16. Risk Profile page
  17. Portfolio page
  18. AI Coach page
  19. Reports page

Phase 5: Admin
  20. Admin layout + admin pages

Phase 6: Polish
  21. Loading skeletons
  22. Error boundaries
  23. Dark mode toggle
  24. Responsive mobile layout
```
