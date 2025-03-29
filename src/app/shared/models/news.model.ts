import {PaginationQueryModel} from './pagination.model';

export interface News {
  description: string
  id: number
  imageDescription: string
  publishDate: Date
  title: string
  vipCategory: string
}

export interface NewsDetail {
  id: number
  category: string
  publishDate: Date
  title: string
  content: string
  imageContent: string
  imageDescription: string
}


export interface NewsCategory {
  id: number
  name: string
  active: boolean
}

export interface NewsCategoryQuery {
  isActive: boolean
}

export interface NewsQuery extends PaginationQueryModel{
  categoryId: number;
  year: number;

}
