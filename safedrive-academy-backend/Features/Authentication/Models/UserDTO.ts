import { UserRoleEnum } from "./UserRoleEnum";

export interface UserDTO {
  Id: string;
  PhoneNumber: string;
  FullName: string;
  Role: UserRoleEnum | string;
  IsActive: boolean;
}

