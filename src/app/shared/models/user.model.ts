export interface UserTokenInfo {
  accessToken: string;
  refreshToken: string;
  given_name: string;
  family_name: string;
  full_name: string;
  email: string;
}

export interface UserInfo extends UserTokenInfo{
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
