import { UserDTO } from "./UserDTO";

export interface LoginResponseDTO {
  Token: string;
  RefreshToken: string;
  User: UserDTO;
}

