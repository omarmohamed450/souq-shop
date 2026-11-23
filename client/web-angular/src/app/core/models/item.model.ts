import { Category } from './category.model';

export interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categories: Category[];
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagerItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  categories: Category[];
  isHidden: boolean;
  createdAt?: string;
  updatedAt?: string;
}
