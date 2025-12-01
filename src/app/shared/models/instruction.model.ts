import { ITranslateName } from "../pipes/name-translate.pipe";

export interface InstructionModel {
  id: number;
  title: string;
  filePath: string;
  active?: boolean | null;
  systemName: string;
  subsystemName: string;
  loginCreated: string;
  createdAt: string;
  size: string;
  contentType: string;
  lastModified: string;
}

export interface ITranslatePath {
  ru: string;
  kz: string;
}
