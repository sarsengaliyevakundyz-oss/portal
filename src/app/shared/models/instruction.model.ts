import { ITranslateName } from "../pipes/name-translate.pipe";

export interface InstructionModel {
  id: number;
  titleRu: string;
  titleKz: string;
  fileRuPath: string;
  fileKzPath: string;
  active: boolean | null;
  systemId: number;
  subsystemId: number;
}

export interface ITranslatePath {
  ru: string;
  kz: string;
}
