import { ChecklistCategoria } from "./checklist-categoria.model";

export interface Checklist {

    id: number;

    nome: string;

    progresso: number;

    categorias: ChecklistCategoria[];
}
