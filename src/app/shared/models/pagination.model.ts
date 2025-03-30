export interface PaginationResultModel<T> {
  pageable: Pageable
  response: T[]
}

export interface PaginationQueryModel {
  page: number;
  limit: number;
}

export interface Pageable {
  total: number
  totalPages: number
  pageNumber: number
  pageSize: number
}
