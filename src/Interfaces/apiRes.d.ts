
  export interface ApiQueryRes<T> {
    error?: any;
    data?: T;
    message?: string;
    status?: string;
  }
  

  export interface PaginationResult<T=any> {
    next?: { page: number; limit: number };
    previous?: { page: number; limit: number };
    currentPage?: number;
    totalPages?: number;
    totalDocuments?: number;
    results?: T[];
  }