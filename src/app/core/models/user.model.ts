export type Role = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  token: string;
}
