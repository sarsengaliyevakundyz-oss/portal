import {PaginationQueryModel} from './pagination.model';
import {ITranslateName} from '../pipes/name-translate.pipe';

export interface News {
  description: string
  id: number
  imageDescription: string
  publishDate: Date | string
  title: string
  vipCategory: string
}

export interface PaginationResultModel<T> {
  pageable: {
    total: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  };
  response: T[];
}

export interface NewsDetail {
  id: number
  categoryId: number
  publishDate: Date | string
  title: string
  content: string
  imageContent: string
  imageDescription: string
}


export interface NewsCategory {
  id: number
  name: ITranslateName
  active: boolean
  imagePath?: string
}

export interface NewsCategoryQuery {
  isActive: boolean
}

export interface NewsQuery extends PaginationQueryModel{
  categoryId: number;
  year: number;

}
