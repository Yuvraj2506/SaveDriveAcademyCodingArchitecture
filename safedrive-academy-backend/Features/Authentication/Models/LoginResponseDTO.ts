import { UserDTO } from "./UserDTO";

export interface LoginResponseDTO {
  Token: string;
  User: UserDTO;
}

