export interface PaginateResult<T> {
    next?: { page: number; limit: number };
    previous?: { page: number; limit: number };
    results?: T[];
    currentPage?: number;
    totalPages?: number;
  }
  

  export interface ApiQueryRes<T> {
    error?: any;
    data?: T;
    message?: string;
    status?: string;
  }
  