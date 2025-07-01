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
  login: string;
  fullName: string;
  systems: SystemInfo[];
}

export interface SystemWrapper {
  system: System;
}

export interface System {
  systemInfo: SystemInfo;
  children: Child[];
}

export interface SystemInfo {
  id: number;
  name: string;
  code: string;
  subsystems: Subsystem[];
}

export interface Subsystem {
  id: number;
  name: string;
  roles: string[];
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
