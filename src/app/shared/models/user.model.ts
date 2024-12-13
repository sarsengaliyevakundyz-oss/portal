export interface UserTokenInfo {
  accessToken: string;
  given_name: string;
  family_name: string;
  full_name: string;
  "email": string;
}

export enum RoleEnum {
  Admin = 'Admin',
  User = 'User'
}
