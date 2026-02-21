# 16. Mobile Apps - Native Application Features

## Overview

The Digital Church Platform mobile app provides a native iOS and Android experience built with React Native and Expo. Each church tenant gets their own white-labeled app with full customization, offering seamless access to sermons, giving, events, groups, and community features while maintaining offline capabilities and deep integration with the platform.

---

## Competitive Analysis

| Feature | Tithely | Pushpay | Subsplash | **Digital Church Platform** |
|---------|---------|---------|-----------|----------------------------|
| Custom Branding | Yes | Yes | Yes | **Yes + Dynamic Theming** |
| White-label Apps | Premium | Premium | Included | **Included** |
| App Store Submission | Manual | Manual | Automated | **Automated** |
| Sermon Player | Basic | None | Advanced | **Advanced + Offline** |
| Mobile Giving | Native | Advanced | Good | **Advanced + Wallet** |
| Push Notifications | Basic | Segment | Good | **Rich + Scheduled** |
| Offline Support | Limited | None | Good | **Full Offline Mode** |
| Deep Linking | Basic | Basic | Good | **Universal Links** |
| Event Check-in | Separate App | None | Premium | **Integrated** |
| Groups Integration | Limited | None | Good | **Full Integration** |
| Biometric Login | Premium | Premium | Yes | **Included** |
| Build Time | 2-4 weeks | 2-4 weeks | 1-2 weeks | **<24 hours** |

---

## Key Features

1. **White-Label Apps**: Fully customizable branding per church tenant
2. **Offline Support**: Core features work without internet connection
3. **Mobile Giving**: Quick donations with saved payment methods and Apple Pay/Google Pay
4. **Sermon Library**: Stream, download, and listen to sermons with background playback
5. **Event Management**: View, register, and check-in to events
6. **Groups**: Access group content, discussions, and prayer requests
7. **Member Directory**: Searchable church directory with privacy controls
8. **Push Notifications**: Rich notifications with deep linking
9. **Biometric Security**: Face ID, Touch ID, and fingerprint authentication
10. **Analytics**: User engagement tracking and behavior analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Mobile App Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        React Native / Expo                               ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │   Screens   │  │ Components  │  │    Hooks    │  │   Stores    │    ││
│  │  │             │  │             │  │             │  │  (Zustand)  │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │                        Navigation (Expo Router)                  │   ││
│  │  │    Tab Navigator  │  Stack Navigator  │  Deep Linking            │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Services Layer                                    ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │     API     │  │   Storage   │  │    Push     │  │   Media     │    ││
│  │  │   Client    │  │  (SQLite +  │  │Notifications│  │   Player    │    ││
│  │  │  (Axios)    │  │ SecureStore)│  │   (FCM)     │  │  (AVPlayer) │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Native Modules                                    ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │  Biometric  │  │   Camera    │  │  Location   │  │  Contacts   │    ││
│  │  │    Auth     │  │  & Scanner  │  │  Services   │  │   Access    │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  │                                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │   Apple     │  │   Google    │  │  Background │  │    Share    │    ││
│  │  │    Pay      │  │    Pay      │  │    Tasks    │  │  Extension  │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Backend API                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   REST API  │  │   GraphQL   │  │  WebSocket  │  │     CDN     │        │
│  │             │  │  (Optional) │  │(Real-time)  │  │   (Media)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Project Structure

### 1.1 Expo Project Setup

```
mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth flow screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                   # Main tab screens
│   │   ├── index.tsx             # Home
│   │   ├── sermons.tsx
│   │   ├── give.tsx
│   │   ├── events.tsx
│   │   ├── more.tsx
│   │   └── _layout.tsx
│   ├── sermon/
│   │   └── [id].tsx
│   ├── event/
│   │   └── [id].tsx
│   ├── group/
│   │   ├── [id].tsx
│   │   └── [id]/
│   │       ├── members.tsx
│   │       ├── discussion.tsx
│   │       └── prayers.tsx
│   ├── profile/
│   │   ├── index.tsx
│   │   ├── edit.tsx
│   │   └── settings.tsx
│   ├── giving/
│   │   ├── history.tsx
│   │   ├── recurring.tsx
│   │   └── statements.tsx
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Loading.tsx
│   │   └── index.ts
│   ├── sermon/
│   │   ├── SermonCard.tsx
│   │   ├── SermonPlayer.tsx
│   │   ├── SermonMiniPlayer.tsx
│   │   └── SermonNotes.tsx
│   ├── giving/
│   │   ├── GiveForm.tsx
│   │   ├── AmountSelector.tsx
│   │   ├── PaymentMethodPicker.tsx
│   │   └── RecurringSetup.tsx
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventCalendar.tsx
│   │   ├── CheckInScanner.tsx
│   │   └── RegistrationForm.tsx
│   ├── groups/
│   │   ├── GroupCard.tsx
│   │   ├── PrayerRequestCard.tsx
│   │   └── DiscussionThread.tsx
│   └── common/
│       ├── Header.tsx
│       ├── TabBar.tsx
│       ├── EmptyState.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── usePushNotifications.ts
│   ├── useOffline.ts
│   ├── useMediaPlayer.ts
│   ├── useBiometric.ts
│   └── useDeepLink.ts
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── sermons.ts
│   │   ├── events.ts
│   │   ├── giving.ts
│   │   ├── groups.ts
│   │   └── members.ts
│   ├── storage/
│   │   ├── secure.ts
│   │   ├── offline.ts
│   │   └── cache.ts
│   ├── notifications/
│   │   ├── push.ts
│   │   └── handlers.ts
│   └── media/
│       ├── player.ts
│       ├── download.ts
│       └── background.ts
├── stores/
│   ├── authStore.ts
│   ├── appStore.ts
│   ├── sermonStore.ts
│   ├── playerStore.ts
│   └── offlineStore.ts
├── utils/
│   ├── constants.ts
│   ├── theme.ts
│   ├── analytics.ts
│   └── helpers.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

### 1.2 App Configuration

```json
// app.json
{
  "expo": {
    "name": "Digital Church",
    "slug": "digital-church",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.digitalchurch.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Used for check-in QR scanning",
        "NSPhotoLibraryUsageDescription": "Upload photos to your profile",
        "NSLocationWhenInUseUsageDescription": "Find nearby churches and events",
        "NSFaceIDUsageDescription": "Secure login with Face ID",
        "UIBackgroundModes": [
          "audio",
          "remote-notification",
          "fetch"
        ]
      },
      "associatedDomains": [
        "applinks:*.digitalchurch.com"
      ]
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.digitalchurch.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ],
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "*.digitalchurch.com",
              "pathPrefix": "/app"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-av",
      "expo-notifications",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for QR code scanning."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 1.3 EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "API_URL": "https://dev-api.digitalchurch.com",
        "ENVIRONMENT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging-api.digitalchurch.com",
        "ENVIRONMENT": "staging"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.digitalchurch.com",
        "ENVIRONMENT": "production"
      }
    },
    "tenant": {
      "extends": "production",
      "env": {
        "TENANT_ID": "${TENANT_ID}",
        "TENANT_SLUG": "${TENANT_SLUG}",
        "APP_NAME": "${APP_NAME}",
        "PRIMARY_COLOR": "${PRIMARY_COLOR}",
        "API_URL": "https://api.digitalchurch.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@digitalchurch.com",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## 2. Core Services

### 2.1 API Client

```typescript
// services/api/client.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.digitalchurch.com';
const TENANT_ID = Constants.expoConfig?.extra?.tenantId;

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(TENANT_ID && { 'X-Tenant-ID': TENANT_ID }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              };
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.handleLogout();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) return null;

        const response = await axios.post(`${API_URL}/api/mobile/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        return accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleLogout() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    useAuthStore.getState().logout();
    router.replace('/(auth)/login');
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 2.2 Authentication Service

```typescript
// services/api/auth.ts
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { apiClient } from './client';
import { useAuthStore } from '@/stores/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  memberId?: string;
}

class AuthService {
  /**
   * Login with email/password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<{
      user: User;
      tokens: AuthTokens;
    }>('/api/mobile/auth/login', credentials);

    await this.storeTokens(response.tokens);

    if (credentials.rememberMe) {
      await SecureStore.setItemAsync('savedEmail', credentials.email);
    }

    useAuthStore.getState().setUser(response.user);
    return response.user;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post<{
      user: User;
      tokens: AuthTokens;
    }>('/api/mobile/auth/register', data);

    await this.storeTokens(response.tokens);
    useAuthStore.getState().setUser(response.user);
    return response.user;
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/mobile/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    useAuthStore.getState().logout();
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<{
    available: boolean;
    biometryType: LocalAuthentication.AuthenticationType | null;
  }> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const biometryType = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      available: compatible && enrolled,
      biometryType: biometryType.length > 0 ? biometryType[0] : null,
    };
  }

  /**
   * Enable biometric login for current user
   */
  async enableBiometric(): Promise<boolean> {
    const { available } = await this.isBiometricAvailable();
    if (!available) return false;

    // Store credentials securely for biometric login
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) return false;

    await SecureStore.setItemAsync('biometricToken', refreshToken);
    await SecureStore.setItemAsync('biometricEnabled', 'true');
    return true;
  }

  /**
   * Login using biometric authentication
   */
  async loginWithBiometric(): Promise<User | null> {
    const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
    if (biometricEnabled !== 'true') return null;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login to Digital Church',
      fallbackLabel: 'Use password',
      cancelLabel: 'Cancel',
    });

    if (!result.success) return null;

    const biometricToken = await SecureStore.getItemAsync('biometricToken');
    if (!biometricToken) return null;

    try {
      const response = await apiClient.post<{
        user: User;
        tokens: AuthTokens;
      }>('/api/mobile/auth/refresh', {
        refreshToken: biometricToken,
      });

      await this.storeTokens(response.tokens);
      useAuthStore.getState().setUser(response.user);
      return response.user;
    } catch (error) {
      // Token expired, disable biometric
      await SecureStore.deleteItemAsync('biometricEnabled');
      await SecureStore.deleteItemAsync('biometricToken');
      return null;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/api/mobile/auth/forgot-password', { email });
  }

  /**
   * Verify reset code and set new password
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/mobile/auth/reset-password', {
      email,
      code,
      newPassword,
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return null;

    try {
      const user = await apiClient.get<User>('/api/mobile/auth/me');
      useAuthStore.getState().setUser(user);
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const user = await apiClient.put<User>('/api/mobile/auth/profile', data);
    useAuthStore.getState().setUser(user);
    return user;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/mobile/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<void> {
    await apiClient.delete('/api/mobile/auth/account');
    await this.logout();
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    await SecureStore.setItemAsync(
      'tokenExpiry',
      String(Date.now() + tokens.expiresIn * 1000)
    );
  }
}

export const authService = new AuthService();
```

### 2.3 Offline Storage Service

```typescript
// services/storage/offline.ts
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

const db = SQLite.openDatabaseSync('digital_church.db');

interface OfflineQueueItem {
  id: string;
  action: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  createdAt: number;
  retryCount: number;
}

interface SyncStatus {
  lastSyncedAt: string | null;
  pendingActions: number;
  isSyncing: boolean;
}

class OfflineStorage {
  private initialized = false;

  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await db.execAsync(`
      -- Sermons cache
      CREATE TABLE IF NOT EXISTS sermons (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        downloadedMediaPath TEXT,
        cachedAt INTEGER NOT NULL
      );

      -- Events cache
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cachedAt INTEGER NOT NULL
      );

      -- Groups cache
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cachedAt INTEGER NOT NULL
      );

      -- Member directory cache
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cachedAt INTEGER NOT NULL
      );

      -- Offline action queue
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        retryCount INTEGER DEFAULT 0
      );

      -- Sync metadata
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Downloaded media
      CREATE TABLE IF NOT EXISTS downloaded_media (
        id TEXT PRIMARY KEY,
        sermonId TEXT NOT NULL,
        filePath TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        downloadedAt INTEGER NOT NULL,
        FOREIGN KEY (sermonId) REFERENCES sermons(id)
      );
    `);

    this.initialized = true;
  }

  /**
   * Cache sermons data
   */
  async cacheSermons(sermons: any[]): Promise<void> {
    const now = Date.now();
    const statement = await db.prepareAsync(
      'INSERT OR REPLACE INTO sermons (id, data, cachedAt) VALUES ($id, $data, $cachedAt)'
    );

    try {
      for (const sermon of sermons) {
        await statement.executeAsync({
          $id: sermon.id,
          $data: JSON.stringify(sermon),
          $cachedAt: now,
        });
      }
    } finally {
      await statement.finalizeAsync();
    }
  }

  /**
   * Get cached sermons
   */
  async getCachedSermons(): Promise<any[]> {
    const result = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM sermons ORDER BY cachedAt DESC'
    );
    return result.map((row) => JSON.parse(row.data));
  }

  /**
   * Get single cached sermon
   */
  async getCachedSermon(id: string): Promise<any | null> {
    const result = await db.getFirstAsync<{ data: string }>(
      'SELECT data FROM sermons WHERE id = ?',
      [id]
    );
    return result ? JSON.parse(result.data) : null;
  }

  /**
   * Add action to offline queue
   */
  async queueAction(action: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
      'INSERT INTO offline_queue (id, action, endpoint, method, data, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, action.action, action.endpoint, action.method, JSON.stringify(action.data), Date.now()]
    );
  }

  /**
   * Get all pending offline actions
   */
  async getPendingActions(): Promise<OfflineQueueItem[]> {
    const results = await db.getAllAsync<{
      id: string;
      action: string;
      endpoint: string;
      method: string;
      data: string;
      createdAt: number;
      retryCount: number;
    }>('SELECT * FROM offline_queue ORDER BY createdAt ASC');

    return results.map((row) => ({
      ...row,
      method: row.method as 'POST' | 'PUT' | 'DELETE',
      data: JSON.parse(row.data),
    }));
  }

  /**
   * Remove action from queue
   */
  async removeFromQueue(id: string): Promise<void> {
    await db.runAsync('DELETE FROM offline_queue WHERE id = ?', [id]);
  }

  /**
   * Update retry count
   */
  async incrementRetryCount(id: string): Promise<void> {
    await db.runAsync(
      'UPDATE offline_queue SET retryCount = retryCount + 1 WHERE id = ?',
      [id]
    );
  }

  /**
   * Store downloaded media info
   */
  async storeDownloadedMedia(sermonId: string, filePath: string, fileSize: number): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO downloaded_media (id, sermonId, filePath, fileSize, downloadedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [sermonId, sermonId, filePath, fileSize, Date.now()]
    );
  }

  /**
   * Get downloaded media path for sermon
   */
  async getDownloadedMediaPath(sermonId: string): Promise<string | null> {
    const result = await db.getFirstAsync<{ filePath: string }>(
      'SELECT filePath FROM downloaded_media WHERE sermonId = ?',
      [sermonId]
    );
    return result?.filePath || null;
  }

  /**
   * Get total downloaded media size
   */
  async getTotalDownloadedSize(): Promise<number> {
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT SUM(fileSize) as total FROM downloaded_media'
    );
    return result?.total || 0;
  }

  /**
   * Clear old cached data
   */
  async clearOldCache(maxAgeDays: number = 30): Promise<void> {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    await db.runAsync('DELETE FROM sermons WHERE cachedAt < ? AND downloadedMediaPath IS NULL', [cutoff]);
    await db.runAsync('DELETE FROM events WHERE cachedAt < ?', [cutoff]);
    await db.runAsync('DELETE FROM groups WHERE cachedAt < ?', [cutoff]);
    await db.runAsync('DELETE FROM members WHERE cachedAt < ?', [cutoff]);
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSynced = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM sync_metadata WHERE key = 'lastSyncedAt'"
    );

    const pendingCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM offline_queue'
    );

    return {
      lastSyncedAt: lastSynced?.value || null,
      pendingActions: pendingCount?.count || 0,
      isSyncing: false,
    };
  }

  /**
   * Update last sync time
   */
  async updateLastSyncTime(): Promise<void> {
    await db.runAsync(
      "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('lastSyncedAt', ?)",
      [new Date().toISOString()]
    );
  }
}

export const offlineStorage = new OfflineStorage();

// Sync service for processing offline queue
export class SyncService {
  private isSyncing = false;

  /**
   * Process offline queue when online
   */
  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) return { success: 0, failed: 0 };

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return { success: 0, failed: 0 };

    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      const actions = await offlineStorage.getPendingActions();

      for (const action of actions) {
        try {
          // Import here to avoid circular dependency
          const { apiClient } = await import('./client');

          switch (action.method) {
            case 'POST':
              await apiClient.post(action.endpoint, action.data);
              break;
            case 'PUT':
              await apiClient.put(action.endpoint, action.data);
              break;
            case 'DELETE':
              await apiClient.delete(action.endpoint);
              break;
          }

          await offlineStorage.removeFromQueue(action.id);
          success++;
        } catch (error) {
          await offlineStorage.incrementRetryCount(action.id);

          // Remove after 5 retries
          if (action.retryCount >= 4) {
            await offlineStorage.removeFromQueue(action.id);
          }
          failed++;
        }
      }

      await offlineStorage.updateLastSyncTime();
    } finally {
      this.isSyncing = false;
    }

    return { success, failed };
  }

  /**
   * Listen for network changes and sync
   */
  startBackgroundSync(): () => void {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        await this.processQueue();
      }
    });

    return unsubscribe;
  }
}

export const syncService = new SyncService();
```

---

## 3. Push Notifications

### 3.1 Push Notification Service

```typescript
// services/notifications/push.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../api/client';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

class PushNotificationService {
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get push token
    const token = await this.getToken();
    if (token) {
      await this.registerToken(token);
    }

    // Set up listeners
    this.setupListeners();

    // Configure Android channel
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    return token;
  }

  /**
   * Get Expo push token or FCM token
   */
  private async getToken(): Promise<string | null> {
    try {
      // For Expo Go, use Expo push token
      // For standalone apps, use FCM token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (projectId) {
        const { data } = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        return data;
      }

      // Fallback to device push token (FCM for Android, APNs for iOS)
      const { data } = await Notifications.getDevicePushTokenAsync();
      return data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  private async registerToken(token: string): Promise<void> {
    try {
      await apiClient.post('/api/mobile/notifications/register', {
        token,
        platform: Platform.OS,
        deviceType: Device.modelName,
        deviceId: Device.modelId,
      });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Set up Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('sermons', {
      name: 'Sermons',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'New sermon notifications',
    });

    await Notifications.setNotificationChannelAsync('events', {
      name: 'Events',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Event reminders and updates',
    });

    await Notifications.setNotificationChannelAsync('giving', {
      name: 'Giving',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Donation confirmations',
    });

    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer Requests',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Group prayer request notifications',
    });
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Foreground notification listener
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Could update badge count or show in-app notification
      }
    );

    // Notification response listener (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.handleNotificationTap(response.notification.request.content.data);
      }
    );
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  private handleNotificationTap(data: Record<string, any>): void {
    const { type, id } = data;

    switch (type) {
      case 'sermon':
        router.push(`/sermon/${id}`);
        break;
      case 'event':
        router.push(`/event/${id}`);
        break;
      case 'group':
        router.push(`/group/${id}`);
        break;
      case 'prayer':
        router.push(`/group/${data.groupId}/prayers`);
        break;
      case 'giving':
        router.push('/giving/history');
        break;
      case 'message':
        router.push(`/group/${data.groupId}/discussion`);
        break;
      default:
        // Navigate to home
        router.push('/(tabs)');
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, any>
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
    return id;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Update notification preferences on server
   */
  async updatePreferences(preferences: {
    sermons: boolean;
    events: boolean;
    giving: boolean;
    prayer: boolean;
    messages: boolean;
  }): Promise<void> {
    await apiClient.put('/api/mobile/notifications/preferences', preferences);
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
```

### 3.2 Push Notification Hook

```typescript
// hooks/usePushNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { pushNotificationService } from '@/services/notifications/push';
import { useAuthStore } from '@/stores/authStore';

interface NotificationPreferences {
  sermons: boolean;
  events: boolean;
  giving: boolean;
  prayer: boolean;
  messages: boolean;
}

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    sermons: true,
    events: true,
    giving: true,
    prayer: true,
    messages: true,
  });
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    }

    return () => {
      pushNotificationService.cleanup();
    };
  }, [isAuthenticated]);

  const initializeNotifications = useCallback(async () => {
    const pushToken = await pushNotificationService.initialize();
    setToken(pushToken);
    setIsInitialized(true);
  }, []);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await pushNotificationService.updatePreferences(updated);
  }, [preferences]);

  const scheduleEventReminder = useCallback(async (
    eventId: string,
    eventTitle: string,
    eventDate: Date,
    reminderMinutes: number = 30
  ) => {
    const triggerDate = new Date(eventDate.getTime() - reminderMinutes * 60 * 1000);

    if (triggerDate > new Date()) {
      return await pushNotificationService.scheduleNotification(
        'Event Reminder',
        `${eventTitle} starts in ${reminderMinutes} minutes`,
        { date: triggerDate },
        { type: 'event', id: eventId }
      );
    }
    return null;
  }, []);

  return {
    token,
    isInitialized,
    preferences,
    updatePreferences,
    scheduleEventReminder,
    setBadgeCount: pushNotificationService.setBadgeCount.bind(pushNotificationService),
    getBadgeCount: pushNotificationService.getBadgeCount.bind(pushNotificationService),
  };
}
```

---

## 4. Media Player

### 4.1 Media Player Service

```typescript
// services/media/player.ts
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import { offlineStorage } from '../storage/offline';

interface PlaybackState {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  playbackRate: number;
  volume: number;
}

interface CurrentMedia {
  id: string;
  title: string;
  speaker?: string;
  artworkUrl?: string;
  audioUrl: string;
  videoUrl?: string;
  isVideo: boolean;
}

interface PlayerStore {
  // State
  currentMedia: CurrentMedia | null;
  playbackState: PlaybackState;
  queue: CurrentMedia[];
  queueIndex: number;
  isMinimized: boolean;

  // Actions
  setCurrentMedia: (media: CurrentMedia | null) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setQueue: (queue: CurrentMedia[], startIndex?: number) => void;
  setMinimized: (minimized: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentMedia: null,
  playbackState: {
    isLoaded: false,
    isPlaying: false,
    isBuffering: false,
    positionMillis: 0,
    durationMillis: 0,
    playbackRate: 1,
    volume: 1,
  },
  queue: [],
  queueIndex: 0,
  isMinimized: true,

  setCurrentMedia: (media) => set({ currentMedia: media }),
  setPlaybackState: (state) =>
    set((prev) => ({ playbackState: { ...prev.playbackState, ...state } })),
  setQueue: (queue, startIndex = 0) => set({ queue, queueIndex: startIndex }),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
}));

class MediaPlayerService {
  private sound: Audio.Sound | null = null;
  private playbackCallback: ((status: AVPlaybackStatus) => void) | null = null;

  /**
   * Initialize audio mode
   */
  async initialize(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  /**
   * Load and play media
   */
  async loadMedia(media: CurrentMedia, startPosition?: number): Promise<void> {
    // Unload previous sound
    if (this.sound) {
      await this.unload();
    }

    usePlayerStore.getState().setCurrentMedia(media);
    usePlayerStore.getState().setPlaybackState({
      isLoaded: false,
      isBuffering: true,
    });

    // Check for downloaded version
    const downloadedPath = await offlineStorage.getDownloadedMediaPath(media.id);
    const audioSource = downloadedPath
      ? { uri: downloadedPath }
      : { uri: media.audioUrl };

    try {
      const { sound } = await Audio.Sound.createAsync(
        audioSource,
        {
          shouldPlay: true,
          positionMillis: startPosition || 0,
          progressUpdateIntervalMillis: 1000,
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
    } catch (error) {
      console.error('Error loading media:', error);
      usePlayerStore.getState().setPlaybackState({
        isLoaded: false,
        isBuffering: false,
      });
      throw error;
    }
  }

  /**
   * Playback status update callback
   */
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      usePlayerStore.getState().setPlaybackState({
        isLoaded: false,
        isBuffering: false,
        isPlaying: false,
      });
      return;
    }

    const successStatus = status as AVPlaybackStatusSuccess;

    usePlayerStore.getState().setPlaybackState({
      isLoaded: true,
      isPlaying: successStatus.isPlaying,
      isBuffering: successStatus.isBuffering,
      positionMillis: successStatus.positionMillis,
      durationMillis: successStatus.durationMillis || 0,
      playbackRate: successStatus.rate,
      volume: successStatus.volume,
    });

    // Handle playback completion
    if (successStatus.didJustFinish) {
      this.handlePlaybackComplete();
    }

    if (this.playbackCallback) {
      this.playbackCallback(status);
    }
  };

  /**
   * Handle playback completion - play next in queue
   */
  private async handlePlaybackComplete(): Promise<void> {
    const { queue, queueIndex } = usePlayerStore.getState();

    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      usePlayerStore.setState({ queueIndex: nextIndex });
      await this.loadMedia(queue[nextIndex]);
    } else {
      // End of queue
      await this.unload();
    }
  }

  /**
   * Play/pause toggle
   */
  async togglePlayPause(): Promise<void> {
    if (!this.sound) return;

    const { isPlaying } = usePlayerStore.getState().playbackState;

    if (isPlaying) {
      await this.sound.pauseAsync();
    } else {
      await this.sound.playAsync();
    }
  }

  /**
   * Seek to position
   */
  async seekTo(positionMillis: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setPositionAsync(positionMillis);
  }

  /**
   * Skip forward by seconds
   */
  async skipForward(seconds: number = 15): Promise<void> {
    if (!this.sound) return;

    const { positionMillis, durationMillis } = usePlayerStore.getState().playbackState;
    const newPosition = Math.min(positionMillis + seconds * 1000, durationMillis);
    await this.seekTo(newPosition);
  }

  /**
   * Skip backward by seconds
   */
  async skipBackward(seconds: number = 15): Promise<void> {
    if (!this.sound) return;

    const { positionMillis } = usePlayerStore.getState().playbackState;
    const newPosition = Math.max(positionMillis - seconds * 1000, 0);
    await this.seekTo(newPosition);
  }

  /**
   * Set playback rate
   */
  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setRateAsync(rate, true);
  }

  /**
   * Set volume
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setVolumeAsync(volume);
  }

  /**
   * Play next in queue
   */
  async playNext(): Promise<void> {
    const { queue, queueIndex } = usePlayerStore.getState();

    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      usePlayerStore.setState({ queueIndex: nextIndex });
      await this.loadMedia(queue[nextIndex]);
    }
  }

  /**
   * Play previous in queue
   */
  async playPrevious(): Promise<void> {
    const { queue, queueIndex, playbackState } = usePlayerStore.getState();

    // If we're more than 3 seconds in, restart current track
    if (playbackState.positionMillis > 3000) {
      await this.seekTo(0);
      return;
    }

    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      usePlayerStore.setState({ queueIndex: prevIndex });
      await this.loadMedia(queue[prevIndex]);
    }
  }

  /**
   * Set callback for playback updates
   */
  setPlaybackCallback(callback: (status: AVPlaybackStatus) => void): void {
    this.playbackCallback = callback;
  }

  /**
   * Unload current sound
   */
  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    usePlayerStore.getState().setCurrentMedia(null);
    usePlayerStore.getState().setPlaybackState({
      isLoaded: false,
      isPlaying: false,
      isBuffering: false,
      positionMillis: 0,
      durationMillis: 0,
    });
  }

  /**
   * Get current playback position for saving progress
   */
  getCurrentPosition(): { mediaId: string; position: number } | null {
    const { currentMedia, playbackState } = usePlayerStore.getState();

    if (!currentMedia) return null;

    return {
      mediaId: currentMedia.id,
      position: playbackState.positionMillis,
    };
  }
}

export const mediaPlayerService = new MediaPlayerService();
```

### 4.2 Media Download Service

```typescript
// services/media/download.ts
import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';
import { offlineStorage } from '../storage/offline';

interface DownloadProgress {
  sermonId: string;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
}

interface DownloadStore {
  downloads: Map<string, DownloadProgress>;
  completedDownloads: Set<string>;

  setDownloadProgress: (sermonId: string, progress: DownloadProgress) => void;
  markComplete: (sermonId: string) => void;
  removeDownload: (sermonId: string) => void;
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloads: new Map(),
  completedDownloads: new Set(),

  setDownloadProgress: (sermonId, progress) =>
    set((state) => {
      const newDownloads = new Map(state.downloads);
      newDownloads.set(sermonId, progress);
      return { downloads: newDownloads };
    }),

  markComplete: (sermonId) =>
    set((state) => {
      const newDownloads = new Map(state.downloads);
      newDownloads.delete(sermonId);
      const newCompleted = new Set(state.completedDownloads);
      newCompleted.add(sermonId);
      return { downloads: newDownloads, completedDownloads: newCompleted };
    }),

  removeDownload: (sermonId) =>
    set((state) => {
      const newDownloads = new Map(state.downloads);
      newDownloads.delete(sermonId);
      return { downloads: newDownloads };
    }),
}));

class MediaDownloadService {
  private activeDownloads = new Map<string, FileSystem.DownloadResumable>();
  private downloadDirectory = FileSystem.documentDirectory + 'sermons/';

  /**
   * Initialize download directory
   */
  async initialize(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.downloadDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.downloadDirectory, { intermediates: true });
    }

    // Load completed downloads from database
    await this.loadCompletedDownloads();
  }

  /**
   * Load completed downloads from storage
   */
  private async loadCompletedDownloads(): Promise<void> {
    // This would query the offline storage for completed downloads
    // and populate the store
  }

  /**
   * Download sermon audio
   */
  async downloadSermon(
    sermonId: string,
    audioUrl: string,
    title: string
  ): Promise<string> {
    // Check if already downloaded
    const existingPath = await offlineStorage.getDownloadedMediaPath(sermonId);
    if (existingPath) {
      const fileInfo = await FileSystem.getInfoAsync(existingPath);
      if (fileInfo.exists) {
        return existingPath;
      }
    }

    // Create file path
    const extension = audioUrl.split('.').pop() || 'mp3';
    const fileName = `${sermonId}.${extension}`;
    const filePath = this.downloadDirectory + fileName;

    // Create download resumable
    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      filePath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        useDownloadStore.getState().setDownloadProgress(sermonId, {
          sermonId,
          progress,
          totalBytes: downloadProgress.totalBytesExpectedToWrite,
          downloadedBytes: downloadProgress.totalBytesWritten,
        });
      }
    );

    this.activeDownloads.set(sermonId, downloadResumable);

    try {
      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        // Save to offline storage
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        await offlineStorage.storeDownloadedMedia(
          sermonId,
          result.uri,
          (fileInfo as any).size || 0
        );

        useDownloadStore.getState().markComplete(sermonId);
        return result.uri;
      }

      throw new Error('Download failed');
    } catch (error) {
      useDownloadStore.getState().removeDownload(sermonId);
      throw error;
    } finally {
      this.activeDownloads.delete(sermonId);
    }
  }

  /**
   * Pause download
   */
  async pauseDownload(sermonId: string): Promise<void> {
    const download = this.activeDownloads.get(sermonId);
    if (download) {
      await download.pauseAsync();
    }
  }

  /**
   * Resume download
   */
  async resumeDownload(sermonId: string): Promise<void> {
    const download = this.activeDownloads.get(sermonId);
    if (download) {
      await download.resumeAsync();
    }
  }

  /**
   * Cancel download
   */
  async cancelDownload(sermonId: string): Promise<void> {
    const download = this.activeDownloads.get(sermonId);
    if (download) {
      await download.cancelAsync();
      this.activeDownloads.delete(sermonId);
      useDownloadStore.getState().removeDownload(sermonId);
    }
  }

  /**
   * Delete downloaded sermon
   */
  async deleteDownload(sermonId: string): Promise<void> {
    const filePath = await offlineStorage.getDownloadedMediaPath(sermonId);

    if (filePath) {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    }

    // Remove from database
    await offlineStorage.removeDownloadedMedia(sermonId);

    // Update store
    const store = useDownloadStore.getState();
    const newCompleted = new Set(store.completedDownloads);
    newCompleted.delete(sermonId);
    useDownloadStore.setState({ completedDownloads: newCompleted });
  }

  /**
   * Check if sermon is downloaded
   */
  async isDownloaded(sermonId: string): Promise<boolean> {
    const filePath = await offlineStorage.getDownloadedMediaPath(sermonId);
    if (!filePath) return false;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  }

  /**
   * Get total storage used by downloads
   */
  async getStorageUsed(): Promise<{
    totalBytes: number;
    formattedSize: string;
  }> {
    const totalBytes = await offlineStorage.getTotalDownloadedSize();

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    return {
      totalBytes,
      formattedSize: formatSize(totalBytes),
    };
  }

  /**
   * Clear all downloads
   */
  async clearAllDownloads(): Promise<void> {
    // Cancel active downloads
    for (const [sermonId] of this.activeDownloads) {
      await this.cancelDownload(sermonId);
    }

    // Delete all files
    const dirInfo = await FileSystem.getInfoAsync(this.downloadDirectory);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(this.downloadDirectory, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.downloadDirectory, { intermediates: true });
    }

    // Clear database
    // await offlineStorage.clearAllDownloads();

    useDownloadStore.setState({ completedDownloads: new Set() });
  }
}

export const mediaDownloadService = new MediaDownloadService();
```

---

## 5. Mobile Giving

### 5.1 Giving Service

```typescript
// services/api/giving.ts
import { apiClient } from './client';
import { offlineStorage } from '../storage/offline';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'apple_pay' | 'google_pay';
  last4: string;
  brand?: string;
  bankName?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface GivingFund {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  goal?: number;
  raised?: number;
}

export interface DonationInput {
  amount: number;
  fundId: string;
  paymentMethodId?: string;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringStartDate?: string;
  memo?: string;
  isAnonymous?: boolean;
  coverFees?: boolean;
}

export interface Donation {
  id: string;
  amount: number;
  fund: GivingFund;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  createdAt: string;
  isRecurring: boolean;
  memo?: string;
}

export interface RecurringDonation {
  id: string;
  amount: number;
  fund: GivingFund;
  frequency: string;
  nextDate: string;
  paymentMethod: PaymentMethod;
  isActive: boolean;
  createdAt: string;
}

export interface GivingStatement {
  year: number;
  totalAmount: number;
  donations: Array<{
    date: string;
    amount: number;
    fund: string;
  }>;
}

class GivingService {
  /**
   * Get giving funds
   */
  async getFunds(): Promise<GivingFund[]> {
    return await apiClient.get<GivingFund[]>('/api/mobile/giving/funds');
  }

  /**
   * Get saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await apiClient.get<PaymentMethod[]>('/api/mobile/giving/payment-methods');
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(token: string): Promise<PaymentMethod> {
    return await apiClient.post<PaymentMethod>('/api/mobile/giving/payment-methods', {
      token,
    });
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(id: string): Promise<void> {
    await apiClient.delete(`/api/mobile/giving/payment-methods/${id}`);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(id: string): Promise<void> {
    await apiClient.put(`/api/mobile/giving/payment-methods/${id}/default`);
  }

  /**
   * Create payment intent for donation
   */
  async createPaymentIntent(input: DonationInput): Promise<{
    clientSecret: string;
    donationId: string;
  }> {
    return await apiClient.post('/api/mobile/giving/payment-intent', input);
  }

  /**
   * Process donation (after payment confirmed)
   */
  async confirmDonation(donationId: string, paymentIntentId: string): Promise<Donation> {
    return await apiClient.post<Donation>('/api/mobile/giving/confirm', {
      donationId,
      paymentIntentId,
    });
  }

  /**
   * Quick give with saved payment method
   */
  async quickGive(input: DonationInput): Promise<Donation> {
    const result = await apiClient.post<Donation>('/api/mobile/giving/quick-give', input);

    // If offline, queue the donation
    if (!result) {
      await offlineStorage.queueAction({
        action: 'donation',
        endpoint: '/api/mobile/giving/quick-give',
        method: 'POST',
        data: input,
      });
    }

    return result;
  }

  /**
   * Get donation history
   */
  async getDonationHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    fundId?: string;
  }): Promise<{
    donations: Donation[];
    total: number;
    hasMore: boolean;
  }> {
    return await apiClient.get('/api/mobile/giving/history', { params });
  }

  /**
   * Get recurring donations
   */
  async getRecurringDonations(): Promise<RecurringDonation[]> {
    return await apiClient.get<RecurringDonation[]>('/api/mobile/giving/recurring');
  }

  /**
   * Update recurring donation
   */
  async updateRecurringDonation(
    id: string,
    updates: {
      amount?: number;
      fundId?: string;
      frequency?: string;
      paymentMethodId?: string;
      nextDate?: string;
    }
  ): Promise<RecurringDonation> {
    return await apiClient.put<RecurringDonation>(
      `/api/mobile/giving/recurring/${id}`,
      updates
    );
  }

  /**
   * Cancel recurring donation
   */
  async cancelRecurringDonation(id: string): Promise<void> {
    await apiClient.delete(`/api/mobile/giving/recurring/${id}`);
  }

  /**
   * Get giving statement
   */
  async getStatement(year: number): Promise<GivingStatement> {
    return await apiClient.get<GivingStatement>(`/api/mobile/giving/statement/${year}`);
  }

  /**
   * Download statement PDF
   */
  async downloadStatementPdf(year: number): Promise<string> {
    const response = await apiClient.get<{ url: string }>(
      `/api/mobile/giving/statement/${year}/pdf`
    );
    return response.url;
  }

  /**
   * Get giving summary
   */
  async getGivingSummary(): Promise<{
    thisYear: number;
    lastYear: number;
    thisMonth: number;
    lastMonth: number;
    recurringTotal: number;
    recentDonations: Donation[];
  }> {
    return await apiClient.get('/api/mobile/giving/summary');
  }

  /**
   * Calculate processing fee
   */
  calculateFee(amount: number): number {
    // 2.0% + $0.25
    return Math.round((amount * 0.02 + 0.25) * 100) / 100;
  }
}

export const givingService = new GivingService();
```

### 5.2 Mobile Giving Component

```tsx
// components/giving/GiveForm.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import * as ApplePay from 'expo-apple-pay';
import { useQuery, useMutation } from '@tanstack/react-query';
import { givingService, DonationInput, PaymentMethod, GivingFund } from '@/services/api/giving';
import { Button, Input, Card, Loading } from '@/components/ui';
import { formatCurrency } from '@/utils/helpers';
import { useTheme } from '@/hooks/useTheme';

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

interface GiveFormProps {
  onSuccess?: (donation: any) => void;
  initialFundId?: string;
}

export function GiveForm({ onSuccess, initialFundId }: GiveFormProps) {
  const { colors } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [amount, setAmount] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<string>(initialFundId || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>('monthly');
  const [coverFees, setCoverFees] = useState(false);
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch funds
  const { data: funds, isLoading: fundsLoading } = useQuery({
    queryKey: ['giving-funds'],
    queryFn: () => givingService.getFunds(),
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => givingService.getPaymentMethods(),
  });

  // Set defaults
  useEffect(() => {
    if (funds && !selectedFund) {
      const defaultFund = funds.find((f) => f.isDefault);
      if (defaultFund) setSelectedFund(defaultFund.id);
    }
  }, [funds]);

  useEffect(() => {
    if (paymentMethods && !selectedPaymentMethod) {
      const defaultMethod = paymentMethods.find((m) => m.isDefault);
      if (defaultMethod) setSelectedPaymentMethod(defaultMethod.id);
    }
  }, [paymentMethods]);

  // Quick give mutation
  const quickGiveMutation = useMutation({
    mutationFn: (input: DonationInput) => givingService.quickGive(input),
    onSuccess: (donation) => {
      Alert.alert(
        'Thank You!',
        `Your donation of ${formatCurrency(donation.amount)} has been processed.`,
        [{ text: 'OK', onPress: () => onSuccess?.(donation) }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to process donation. Please try again.');
    },
  });

  const numericAmount = parseFloat(amount) || 0;
  const fee = coverFees ? givingService.calculateFee(numericAmount) : 0;
  const totalAmount = numericAmount + fee;

  const handleAmountPreset = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleApplePay = async () => {
    if (!ApplePay.isAvailable) {
      Alert.alert('Apple Pay not available');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentRequest = {
        merchantId: 'merchant.com.digitalchurch',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        countryCode: 'US',
        currencyCode: 'USD',
        paymentSummaryItems: [
          { label: 'Donation', amount: totalAmount.toFixed(2) },
        ],
      };

      const payment = await ApplePay.requestPaymentAsync(paymentRequest);

      if (payment) {
        // Process with backend
        const donation = await quickGiveMutation.mutateAsync({
          amount: totalAmount,
          fundId: selectedFund,
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency as any : undefined,
          coverFees,
          memo,
        });

        await ApplePay.completePaymentAsync({ status: ApplePay.PaymentStatus.SUCCESS });
        onSuccess?.(donation);
      }
    } catch (error) {
      await ApplePay.completePaymentAsync({ status: ApplePay.PaymentStatus.FAILURE });
      Alert.alert('Payment Failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    if (!selectedPaymentMethod || numericAmount <= 0) {
      Alert.alert('Please enter an amount and select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { clientSecret, donationId } = await givingService.createPaymentIntent({
        amount: totalAmount,
        fundId: selectedFund,
        paymentMethodId: selectedPaymentMethod,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency as any : undefined,
        coverFees,
        memo,
      });

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Digital Church',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          throw new Error(paymentError.message);
        }
        return;
      }

      // Confirm donation
      const donation = await givingService.confirmDonation(donationId, clientSecret);
      onSuccess?.(donation);
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickGive = async () => {
    if (!selectedPaymentMethod || numericAmount <= 0) {
      Alert.alert('Please enter an amount and select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      await quickGiveMutation.mutateAsync({
        amount: totalAmount,
        fundId: selectedFund,
        paymentMethodId: selectedPaymentMethod,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency as any : undefined,
        coverFees,
        memo,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (fundsLoading || paymentMethodsLoading) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Amount Input */}
      <Card style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Amount</Text>

        <View style={styles.amountInputContainer}>
          <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
          <Input
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.presetContainer}>
          {PRESET_AMOUNTS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                { borderColor: colors.border },
                amount === preset.toString() && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => handleAmountPreset(preset)}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: amount === preset.toString() ? 'white' : colors.text },
                ]}
              >
                ${preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Fund Selection */}
      <Card style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Give To</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {funds?.map((fund) => (
            <TouchableOpacity
              key={fund.id}
              style={[
                styles.fundButton,
                { borderColor: colors.border },
                selectedFund === fund.id && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedFund(fund.id)}
            >
              <Text
                style={[
                  styles.fundText,
                  { color: selectedFund === fund.id ? 'white' : colors.text },
                ]}
              >
                {fund.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Recurring Toggle */}
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.recurringToggle}
          onPress={() => setIsRecurring(!isRecurring)}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              isRecurring && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {isRecurring && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.recurringText, { color: colors.text }]}>
            Make this a recurring gift
          </Text>
        </TouchableOpacity>

        {isRecurring && (
          <View style={styles.frequencyContainer}>
            {['weekly', 'biweekly', 'monthly', 'quarterly'].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyButton,
                  { borderColor: colors.border },
                  recurringFrequency === freq && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setRecurringFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    { color: recurringFrequency === freq ? 'white' : colors.text },
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* Cover Fees */}
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.recurringToggle}
          onPress={() => setCoverFees(!coverFees)}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              coverFees && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {coverFees && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View>
            <Text style={[styles.recurringText, { color: colors.text }]}>
              Cover processing fees
            </Text>
            {numericAmount > 0 && (
              <Text style={[styles.feeText, { color: colors.textSecondary }]}>
                Add {formatCurrency(givingService.calculateFee(numericAmount))} to help cover costs
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Card>

      {/* Payment Methods */}
      <Card style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Payment Method</Text>

        {paymentMethods?.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              { borderColor: colors.border },
              selectedPaymentMethod === method.id && {
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
          >
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                {method.type === 'card'
                  ? `${method.brand} •••• ${method.last4}`
                  : `${method.bankName} •••• ${method.last4}`}
              </Text>
              {method.type === 'card' && (
                <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
                  Exp {method.expiryMonth}/{method.expiryYear}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.radio,
                { borderColor: colors.border },
                selectedPaymentMethod === method.id && {
                  borderColor: colors.primary,
                },
              ]}
            >
              {selectedPaymentMethod === method.id && (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Summary */}
      {numericAmount > 0 && (
        <Card style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Donation</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(numericAmount)}
            </Text>
          </View>
          {coverFees && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Processing Fee
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(fee)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {Platform.OS === 'ios' && (
          <Button
            variant="outline"
            onPress={handleApplePay}
            disabled={isProcessing || numericAmount <= 0}
            style={styles.applePayButton}
          >
            <Text style={styles.applePayText}> Pay</Text>
          </Button>
        )}

        <Button
          onPress={handleQuickGive}
          disabled={isProcessing || numericAmount <= 0 || !selectedPaymentMethod}
          loading={isProcessing}
        >
          {isRecurring ? 'Start Recurring Gift' : 'Give Now'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    borderWidth: 0,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fundButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  fundText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recurringText: {
    fontSize: 16,
  },
  feeText: {
    fontSize: 12,
    marginTop: 2,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginLeft: 36,
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    marginTop: 8,
    marginBottom: 32,
    gap: 12,
  },
  applePayButton: {
    backgroundColor: 'black',
  },
  applePayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 6. Deep Linking

### 6.1 Deep Linking Configuration

```typescript
// hooks/useDeepLink.ts
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

const DEEP_LINK_PREFIX = Linking.createURL('/');

export function useDeepLink() {
  const navigationState = useRootNavigationState();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    if (navigationState?.key) {
      handleInitialURL();
    }

    return () => {
      subscription.remove();
    };
  }, [navigationState?.key, isAuthenticated]);

  const handleDeepLink = (url: string) => {
    const { path, queryParams } = Linking.parse(url);

    if (!path) return;

    // Parse the path and navigate accordingly
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      router.push('/(tabs)');
      return;
    }

    switch (segments[0]) {
      case 'sermon':
        if (segments[1]) {
          router.push(`/sermon/${segments[1]}`);
        }
        break;

      case 'event':
        if (segments[1]) {
          router.push(`/event/${segments[1]}`);
        }
        break;

      case 'group':
        if (segments[1]) {
          if (segments[2]) {
            router.push(`/group/${segments[1]}/${segments[2]}`);
          } else {
            router.push(`/group/${segments[1]}`);
          }
        }
        break;

      case 'give':
        if (!isAuthenticated) {
          // Store intended destination
          router.push({
            pathname: '/(auth)/login',
            params: { redirect: '/give' },
          });
        } else {
          const fundId = queryParams?.fund as string;
          const amount = queryParams?.amount as string;

          router.push({
            pathname: '/(tabs)/give',
            params: { fundId, amount },
          });
        }
        break;

      case 'checkin':
        if (segments[1]) {
          router.push({
            pathname: '/event/checkin',
            params: { eventId: segments[1] },
          });
        }
        break;

      case 'prayer':
        if (segments[1]) {
          router.push(`/group/${segments[1]}/prayers`);
        }
        break;

      case 'profile':
        if (!isAuthenticated) {
          router.push('/(auth)/login');
        } else {
          router.push('/profile');
        }
        break;

      default:
        router.push('/(tabs)');
    }
  };

  return {
    handleDeepLink,
    createDeepLink: (path: string) => Linking.createURL(path),
  };
}

/**
 * Generate deep link URLs for sharing
 */
export function generateDeepLink(type: string, id: string, params?: Record<string, string>): string {
  const baseUrl = 'https://app.digitalchurch.com';
  let path = `/${type}/${id}`;

  if (params) {
    const queryString = new URLSearchParams(params).toString();
    path += `?${queryString}`;
  }

  return baseUrl + path;
}

/**
 * Generate share content
 */
export function generateShareContent(
  type: 'sermon' | 'event' | 'group',
  item: { id: string; title: string; description?: string }
): { title: string; message: string; url: string } {
  const url = generateDeepLink(type, item.id);

  switch (type) {
    case 'sermon':
      return {
        title: item.title,
        message: `Check out this sermon: ${item.title}`,
        url,
      };
    case 'event':
      return {
        title: item.title,
        message: `Join me at ${item.title}! ${item.description || ''}`,
        url,
      };
    case 'group':
      return {
        title: item.title,
        message: `Join our group: ${item.title}`,
        url,
      };
  }
}
```

---

## 7. App Store Deployment

### 7.1 Automated Build Pipeline

```typescript
// scripts/build-tenant-app.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TenantConfig {
  tenantId: string;
  tenantSlug: string;
  appName: string;
  primaryColor: string;
  iosBundleId: string;
  androidPackage: string;
  iconPath: string;
  splashPath: string;
  appleTeamId?: string;
  googleServicesJson?: string;
}

async function buildTenantApp(config: TenantConfig) {
  console.log(`Building app for tenant: ${config.tenantSlug}`);

  // 1. Generate app.json for tenant
  const appConfig = generateAppConfig(config);
  fs.writeFileSync(
    path.join(__dirname, '../app.json'),
    JSON.stringify(appConfig, null, 2)
  );

  // 2. Generate theme file
  generateThemeFile(config.primaryColor);

  // 3. Copy assets
  copyAssets(config);

  // 4. Build with EAS
  const buildCommand = `eas build --platform all --profile tenant --non-interactive`;

  const env = {
    ...process.env,
    TENANT_ID: config.tenantId,
    TENANT_SLUG: config.tenantSlug,
    APP_NAME: config.appName,
    PRIMARY_COLOR: config.primaryColor,
  };

  execSync(buildCommand, { stdio: 'inherit', env });

  console.log(`Build complete for ${config.tenantSlug}`);
}

function generateAppConfig(config: TenantConfig) {
  return {
    expo: {
      name: config.appName,
      slug: config.tenantSlug,
      version: '1.0.0',
      orientation: 'portrait',
      icon: `./assets/tenants/${config.tenantSlug}/icon.png`,
      splash: {
        image: `./assets/tenants/${config.tenantSlug}/splash.png`,
        resizeMode: 'contain',
        backgroundColor: config.primaryColor,
      },
      ios: {
        bundleIdentifier: config.iosBundleId,
        buildNumber: '1',
        supportsTablet: true,
        infoPlist: {
          NSCameraUsageDescription: 'Used for check-in QR scanning',
          UIBackgroundModes: ['audio', 'remote-notification', 'fetch'],
        },
        associatedDomains: [
          `applinks:${config.tenantSlug}.digitalchurch.com`,
        ],
      },
      android: {
        package: config.androidPackage,
        versionCode: 1,
        adaptiveIcon: {
          foregroundImage: `./assets/tenants/${config.tenantSlug}/adaptive-icon.png`,
          backgroundColor: config.primaryColor,
        },
        intentFilters: [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [
              {
                scheme: 'https',
                host: `${config.tenantSlug}.digitalchurch.com`,
              },
            ],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ],
      },
      extra: {
        tenantId: config.tenantId,
        tenantSlug: config.tenantSlug,
        apiUrl: 'https://api.digitalchurch.com',
        primaryColor: config.primaryColor,
        eas: {
          projectId: 'your-project-id',
        },
      },
    },
  };
}

function generateThemeFile(primaryColor: string) {
  const themeContent = `
// Auto-generated theme for tenant
export const tenantTheme = {
  colors: {
    primary: '${primaryColor}',
    primaryDark: '${darkenColor(primaryColor, 20)}',
    primaryLight: '${lightenColor(primaryColor, 20)}',
  },
};
`;

  fs.writeFileSync(
    path.join(__dirname, '../utils/tenant-theme.ts'),
    themeContent
  );
}

function copyAssets(config: TenantConfig) {
  const tenantAssetsDir = path.join(__dirname, `../assets/tenants/${config.tenantSlug}`);

  if (!fs.existsSync(tenantAssetsDir)) {
    fs.mkdirSync(tenantAssetsDir, { recursive: true });
  }

  // Copy icon and splash from config paths
  fs.copyFileSync(config.iconPath, path.join(tenantAssetsDir, 'icon.png'));
  fs.copyFileSync(config.splashPath, path.join(tenantAssetsDir, 'splash.png'));

  // Generate adaptive icon if not provided
  // ... adaptive icon generation logic
}

function darkenColor(hex: string, percent: number): string {
  // Color manipulation logic
  return hex;
}

function lightenColor(hex: string, percent: number): string {
  // Color manipulation logic
  return hex;
}

// Run with tenant config
const tenantConfig: TenantConfig = {
  tenantId: process.env.TENANT_ID!,
  tenantSlug: process.env.TENANT_SLUG!,
  appName: process.env.APP_NAME!,
  primaryColor: process.env.PRIMARY_COLOR || '#4F46E5',
  iosBundleId: `com.digitalchurch.${process.env.TENANT_SLUG}`,
  androidPackage: `com.digitalchurch.${process.env.TENANT_SLUG}`,
  iconPath: process.env.ICON_PATH!,
  splashPath: process.env.SPLASH_PATH!,
};

buildTenantApp(tenantConfig);
```

### 7.2 App Store Submission

```yaml
# .github/workflows/deploy-tenant-app.yml
name: Deploy Tenant App

on:
  workflow_dispatch:
    inputs:
      tenant_id:
        description: 'Tenant ID'
        required: true
      tenant_slug:
        description: 'Tenant Slug'
        required: true
      app_name:
        description: 'App Name'
        required: true
      primary_color:
        description: 'Primary Color (hex)'
        required: true
        default: '#4F46E5'
      platforms:
        description: 'Platforms to build'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - ios
          - android

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Download tenant assets
        run: |
          # Download icon and splash from tenant configuration
          curl -o ./assets/tenants/${{ inputs.tenant_slug }}/icon.png \
            "https://api.digitalchurch.com/tenants/${{ inputs.tenant_id }}/assets/icon.png"
          curl -o ./assets/tenants/${{ inputs.tenant_slug }}/splash.png \
            "https://api.digitalchurch.com/tenants/${{ inputs.tenant_id }}/assets/splash.png"

      - name: Build app
        run: |
          npx ts-node scripts/build-tenant-app.ts
        env:
          TENANT_ID: ${{ inputs.tenant_id }}
          TENANT_SLUG: ${{ inputs.tenant_slug }}
          APP_NAME: ${{ inputs.app_name }}
          PRIMARY_COLOR: ${{ inputs.primary_color }}
          ICON_PATH: ./assets/tenants/${{ inputs.tenant_slug }}/icon.png
          SPLASH_PATH: ./assets/tenants/${{ inputs.tenant_slug }}/splash.png

      - name: Build with EAS
        run: eas build --platform ${{ inputs.platforms }} --profile tenant --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  submit-ios:
    needs: build
    if: inputs.platforms == 'all' || inputs.platforms == 'ios'
    runs-on: ubuntu-latest
    steps:
      - name: Submit to App Store
        run: eas submit --platform ios --latest --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EXPO_APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}

  submit-android:
    needs: build
    if: inputs.platforms == 'all' || inputs.platforms == 'android'
    runs-on: ubuntu-latest
    steps:
      - name: Submit to Play Store
        run: eas submit --platform android --latest --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  notify:
    needs: [submit-ios, submit-android]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Notify tenant
        run: |
          curl -X POST https://api.digitalchurch.com/internal/tenant-apps/notify \
            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "tenantId": "${{ inputs.tenant_id }}",
              "status": "submitted",
              "platforms": "${{ inputs.platforms }}"
            }'
```

---

## 8. Backend Mobile API

### 8.1 Mobile API Routes

```typescript
// app/api/mobile/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateTokens } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown';
    const rateLimitResult = await rateLimit(ip, 'mobile-login', {
      interval: 60,
      uniqueTokenPerInterval: 500,
      max: 5,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const tenantId = request.headers.get('X-Tenant-ID');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenantId,
        isActive: true,
      },
      include: {
        member: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
    const tokens = await generateTokens(user.id, tenantId, expiresIn);

    // Log login
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'MOBILE_LOGIN',
        resource: 'USER',
        resourceId: user.id,
        metadata: {
          ip,
          userAgent: request.headers.get('User-Agent'),
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        memberId: user.member?.id,
      },
      tokens: {
        ...tokens,
        expiresIn,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
```

### 8.2 Push Notification Registration

```typescript
// app/api/mobile/notifications/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth } from '@/lib/mobile-auth';

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  deviceType: z.string().optional(),
  deviceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform, deviceType, deviceId } = registerSchema.parse(body);

    // Upsert push device
    const device = await prisma.pushDevice.upsert({
      where: {
        tenantId_deviceToken: {
          tenantId: auth.tenantId,
          deviceToken: token,
        },
      },
      update: {
        userId: auth.userId,
        platform,
        deviceType,
        deviceModel: deviceId,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        deviceToken: token,
        platform,
        deviceType,
        deviceModel: deviceId,
        isActive: true,
      },
    });

    // Deactivate other devices with same user if they're old
    await prisma.pushDevice.updateMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        id: { not: device.id },
        lastActiveAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      deviceId: device.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Push registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

---

## 9. Analytics & Tracking

### 9.1 Analytics Service

```typescript
// services/analytics.ts
import * as Analytics from 'expo-analytics-amplitude';
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/authStore';

const AMPLITUDE_API_KEY = Constants.expoConfig?.extra?.amplitudeApiKey;

class AnalyticsService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized || !AMPLITUDE_API_KEY) return;

    await Analytics.initializeAsync(AMPLITUDE_API_KEY);
    this.initialized = true;
  }

  async identifyUser(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.initialized) return;

    await Analytics.setUserId(userId);
    if (properties) {
      await Analytics.setUserProperties(properties);
    }
  }

  async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.initialized) return;

    const { user } = useAuthStore.getState();
    const eventProperties = {
      ...properties,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    };

    await Analytics.logEventAsync(eventName, eventProperties);
  }

  // Pre-defined events
  async trackSermonPlay(sermonId: string, sermonTitle: string, position?: number): Promise<void> {
    await this.track('sermon_play', {
      sermon_id: sermonId,
      sermon_title: sermonTitle,
      start_position: position || 0,
    });
  }

  async trackSermonComplete(sermonId: string, sermonTitle: string, duration: number): Promise<void> {
    await this.track('sermon_complete', {
      sermon_id: sermonId,
      sermon_title: sermonTitle,
      duration,
    });
  }

  async trackDonation(amount: number, fundId: string, fundName: string, isRecurring: boolean): Promise<void> {
    await this.track('donation_completed', {
      amount,
      fund_id: fundId,
      fund_name: fundName,
      is_recurring: isRecurring,
    });
  }

  async trackEventRegistration(eventId: string, eventTitle: string): Promise<void> {
    await this.track('event_registration', {
      event_id: eventId,
      event_title: eventTitle,
    });
  }

  async trackEventCheckin(eventId: string, eventTitle: string): Promise<void> {
    await this.track('event_checkin', {
      event_id: eventId,
      event_title: eventTitle,
    });
  }

  async trackGroupJoin(groupId: string, groupName: string): Promise<void> {
    await this.track('group_join', {
      group_id: groupId,
      group_name: groupName,
    });
  }

  async trackPrayerRequest(groupId: string, isAnonymous: boolean): Promise<void> {
    await this.track('prayer_request_created', {
      group_id: groupId,
      is_anonymous: isAnonymous,
    });
  }

  async trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  async trackPushNotificationOpened(notificationType: string, notificationId?: string): Promise<void> {
    await this.track('push_notification_opened', {
      notification_type: notificationType,
      notification_id: notificationId,
    });
  }

  async trackSearch(query: string, resultCount: number, searchType: string): Promise<void> {
    await this.track('search', {
      query,
      result_count: resultCount,
      search_type: searchType,
    });
  }

  async reset(): Promise<void> {
    if (!this.initialized) return;
    await Analytics.clearUserPropertiesAsync();
  }
}

export const analyticsService = new AnalyticsService();
```

---

## 10. Best Practices

### Performance Optimization

1. **Image Optimization**: Use expo-image with caching and progressive loading
2. **List Virtualization**: FlashList for long lists instead of FlatList
3. **Lazy Loading**: Code splitting with React.lazy and Suspense
4. **Memoization**: useMemo and useCallback for expensive computations
5. **Background Tasks**: Use expo-background-fetch for sync operations

### Security

1. **Secure Storage**: Use expo-secure-store for sensitive data
2. **Certificate Pinning**: Implement SSL pinning for API calls
3. **Biometric Auth**: Require biometric for sensitive operations
4. **Token Refresh**: Automatic refresh with retry logic
5. **Data Encryption**: Encrypt offline database

### User Experience

1. **Skeleton Loading**: Show skeletons during data fetch
2. **Pull to Refresh**: Implement on all list screens
3. **Haptic Feedback**: Use expo-haptics for tactile responses
4. **Error Boundaries**: Catch and handle errors gracefully
5. **Accessibility**: Follow WCAG guidelines for mobile

### Offline Support

1. **Cache Strategy**: Implement cache-first with network fallback
2. **Queue Actions**: Store actions when offline, sync when online
3. **Conflict Resolution**: Handle data conflicts during sync
4. **Storage Management**: Auto-clean old cached data
5. **Status Indicators**: Show offline/sync status to users

---

## Document Version

**Version**: 1.0
**Last Updated**: December 2024
**Next Review**: March 2025
