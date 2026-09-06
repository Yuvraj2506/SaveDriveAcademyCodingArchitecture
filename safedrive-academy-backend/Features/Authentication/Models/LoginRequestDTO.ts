import { UserRoleEnum } from "./UserRoleEnum";

export interface LoginRequestDTO {
  PhoneNumber: string;
  Password: string;
  ExpectedRole?: UserRoleEnum;
}

