import {ITranslateName} from '../pipes/name-translate.pipe';

export interface UserTokenInfo {
  accessToken: string;
  refreshToken: string;
  given_name: string;
  family_name: string;
  full_name: string;
  email: string;
}

export interface UserInfo {
  name: string;
  login: string;
  systems: SystemWrapper[];
}

export interface SystemWrapper {
  system: System;
}

export interface System {
  systemInfo: SystemInfo;
  children: Child[];
}

export interface SystemInfo {
  name: ITranslateName;
}

export interface Child {
  name: ITranslateName;
  roles: string[];
}

export interface Role{
  id: number,
  roleName: string
}

export enum RoleEnum {
  Admin = 'Admin',
  User = 'User'
}
