/**
 * Repository Pattern Interfaces
 * Following SOLID principles - Interface Segregation and Dependency Inversion
 */

// Generic repository interface
export interface IRepository<TEntity, TId = string> {
  findAll(): Promise<TEntity[]>;
  findById(id: TId): Promise<TEntity | null>;
  create(entity: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TEntity>;
  update(id: TId, entity: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<boolean>;
}

// Query interface for complex queries
export interface IQueryRepository<TEntity, TFilters = any> {
  findByFilters(filters: TFilters): Promise<TEntity[]>;
  count(filters?: TFilters): Promise<number>;
}

// Real-time subscription interface
export interface IRealtimeRepository<TEntity> {
  subscribe(callback: (data: TEntity[]) => void): () => void;
  subscribeToItem(id: string, callback: (data: TEntity | null) => void): () => void;
}

// Auth interface
export interface IAuthService {
  signIn(email: string, password: string): Promise<any>;
  signUp(email: string, password: string): Promise<any>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<any>;
  onAuthStateChange(callback: (user: any) => void): () => void;
  
  // Passwordless OTP methods
  signInWithOTP(email: string): Promise<any>;
  verifyOTP(email: string, token: string): Promise<any>;
  
  // OAuth methods
  signInWithGoogle(): Promise<any>;
  
  // User management
  linkOTPToAccount(): Promise<any>;
  updateUserPassword(password: string): Promise<any>;
  getUserProviders(): Promise<string[]>;
  getAvailableProviders(): Promise<string[]>;
}

// Storage interface
export interface IStorageService {
  upload(bucket: string, path: string, file: File): Promise<string>;
  download(bucket: string, path: string): Promise<Blob>;
  delete(bucket: string, path: string): Promise<boolean>;
  getPublicUrl(bucket: string, path: string): string;
}

// Error handling
export class RepositoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
